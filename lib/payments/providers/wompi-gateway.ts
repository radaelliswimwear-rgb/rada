import { createHash } from "node:crypto";
import type {
  CardInput,
  PaymentGateway,
  PaymentIntent,
  PaymentStatus,
} from "../types";

// Adaptador real de Wompi (Sprint 16) — reemplaza la simulación del Sprint
// 11/12. Mismo contrato que stripe-gateway.ts (todavía simulado); nada fuera
// de este archivo necesita saber que acá sí hay llamadas de red reales.
//
// IMPORTANTE: no se pudo verificar contra la API real de Wompi en este
// entorno porque no había ninguna credencial configurada (ni siquiera un
// valor incorrecto, como pasó con Cloudinary en el Sprint 15) — ver
// docs/sprints/SPRINT-16.md. El código sigue la documentación pública de la
// API de Wompi (tokens/cards, transactions, firma de integridad), pero
// hasta que alguien cargue WOMPI_PUBLIC_KEY/WOMPI_PRIVATE_KEY/
// WOMPI_INTEGRITY_SECRET reales y pruebe una transacción de sandbox, esto
// debe tratarse como "implementado, no verificado en vivo".
function getBaseUrl(): string {
  return process.env.WOMPI_BASE_URL ?? "https://sandbox.wompi.co/v1";
}

function getCredentials() {
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!publicKey || !privateKey || !integritySecret) {
    throw new Error(
      "Credenciales de Wompi no configuradas. Definí WOMPI_PUBLIC_KEY, WOMPI_PRIVATE_KEY y WOMPI_INTEGRITY_SECRET (ver .env.example).",
    );
  }
  return { publicKey, privateKey, integritySecret };
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

const STATUS_FROM_WOMPI: Record<string, PaymentStatus> = {
  APPROVED: "succeeded",
  DECLINED: "failed",
  VOIDED: "cancelled",
  ERROR: "failed",
  PENDING: "pending",
};

type WompiTransaction = {
  id: string;
  status: string;
  status_message?: string;
};

async function tokenizeCard(
  card: CardInput,
  publicKey: string,
): Promise<string> {
  const [expMonth, expYear] = card.expiry.split("/").map((part) => part.trim());
  const response = await fetch(`${getBaseUrl()}/tokens/cards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicKey}`,
    },
    body: JSON.stringify({
      number: card.cardNumber.replace(/\s/g, ""),
      cvc: card.cvc,
      exp_month: expMonth,
      exp_year: expYear,
      card_holder: card.cardholderName,
    }),
  });
  const json = await response.json();
  if (!response.ok || !json?.data?.id) {
    throw new Error(
      json?.error?.reason ??
        json?.error?.messages?.[0] ??
        "No se pudo validar la tarjeta.",
    );
  }
  return json.data.id as string;
}

function buildIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string,
): string {
  // Fórmula documentada por Wompi: SHA-256 de la concatenación
  // referencia + monto_en_centavos + moneda + secreto_de_integridad.
  return createHash("sha256")
    .update(`${reference}${amountInCents}${currency}${integritySecret}`)
    .digest("hex");
}

async function fetchTransaction(
  transactionId: string,
  privateKey: string,
): Promise<WompiTransaction> {
  const response = await fetch(
    `${getBaseUrl()}/transactions/${transactionId}`,
    {
      headers: { Authorization: `Bearer ${privateKey}` },
    },
  );
  const json = await response.json();
  return json.data as WompiTransaction;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const wompiGateway: PaymentGateway = {
  provider: "wompi",

  async createIntent(amount, currency) {
    // La "referencia" es nuestra, no la genera Wompi — es lo que
    // payments-actions.ts guarda como providerRef y lo que Wompi devuelve
    // tal cual en cada evento de webhook (data.transaction.reference), así
    // que es la clave que usamos para encontrar el pago sin importar si la
    // confirmación llega sincrónicamente acá o después por el webhook.
    return {
      id: `lago-${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`,
      provider: "wompi",
      amount,
      currency,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
  },

  async confirmPayment(intent, card, customerEmail) {
    let credentials: ReturnType<typeof getCredentials>;
    try {
      credentials = getCredentials();
    } catch (error) {
      console.error(
        "wompiGateway.confirmPayment: credenciales faltantes",
        error,
      );
      return {
        ...intent,
        status: "failed",
        failureReason: "La pasarela de pago no está configurada.",
      };
    }

    try {
      const token = await tokenizeCard(card, credentials.publicKey);
      const amountInCents = toCents(intent.amount);
      const signature = buildIntegritySignature(
        intent.id,
        amountInCents,
        intent.currency,
        credentials.integritySecret,
      );

      const response = await fetch(`${getBaseUrl()}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${credentials.privateKey}`,
        },
        body: JSON.stringify({
          amount_in_cents: amountInCents,
          currency: intent.currency,
          customer_email: customerEmail ?? "invitado@lago.com",
          reference: intent.id,
          signature,
          payment_method: {
            type: "CARD",
            installments: 1,
            token,
          },
        }),
      });
      const json = await response.json();
      if (!response.ok || !json?.data?.id) {
        return {
          ...intent,
          status: "failed",
          failureReason:
            json?.error?.reason ??
            "El pago no pudo procesarse. Probá con otra tarjeta.",
        };
      }

      let transaction: WompiTransaction = json.data;
      // Un pago con tarjeta puede volver PENDING de entrada (resolución
      // antifraude asincrónica) y confirmarse segundos después. Se reintenta
      // un par de veces acá para no devolverle al checkout un "pendiente"
      // que en la práctica se resuelve casi de inmediato; si sigue pendiente
      // después de los reintentos, el webhook (app/api/webhooks/wompi) es
      // quien termina de actualizar el pago — el pedido, en ese caso, no se
      // llega a crear en este intento (ver limitación en SPRINT-16.md).
      for (
        let attempt = 0;
        attempt < 3 && transaction.status === "PENDING";
        attempt++
      ) {
        await wait(1500);
        transaction = await fetchTransaction(
          transaction.id,
          credentials.privateKey,
        );
      }

      const status = STATUS_FROM_WOMPI[transaction.status] ?? "pending";
      return {
        ...intent,
        status,
        failureReason:
          status === "failed"
            ? (transaction.status_message ?? "Transacción rechazada.")
            : undefined,
      };
    } catch (error) {
      console.error(
        "wompiGateway.confirmPayment: error llamando a la API de Wompi",
        error,
      );
      return {
        ...intent,
        status: "failed",
        failureReason: "No se pudo conectar con la pasarela de pago.",
      };
    }
  },
};
