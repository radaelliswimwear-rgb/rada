import { createHash } from "node:crypto";
import type {
  CardInput,
  PaymentGateway,
  PaymentIntent,
  PaymentStatus,
  WompiAcceptanceTokens,
} from "../types";

// Adaptador real de Wompi (Sprint 16, verificado en vivo contra Sandbox en
// el Sprint 27). Mismo contrato que stripe-gateway.ts (todavía simulado);
// nada fuera de este archivo necesita saber que acá sí hay llamadas de red
// reales.
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

export type WompiAcceptanceInfo = {
  acceptanceToken: string;
  acceptancePermalink: string;
  personalAuthToken?: string;
  personalAuthPermalink?: string;
};

// Ley de Habeas Data (Colombia): antes de crear una transacción, Wompi
// exige mandarle un "token de aceptación" que representa que el cliente
// leyó y aceptó explícitamente sus contratos (política de privacidad y,
// si el comercio la tiene configurada, la autorización de datos
// personales) — ver docs.wompi.co/docs/colombia/tokens-de-aceptacion. Los
// tokens y los links reales a los PDF (permalink) se piden en vivo acá;
// nunca se inventan ni se hardcodean, porque Wompi los firma con una
// fecha de vencimiento corta. El checkout (components/checkout/
// checkout-content.tsx) le muestra estos links al cliente con checkboxes
// reales antes de dejarlo pagar — sin eso, Wompi rechaza la transacción
// con 422 "acceptance_token no está presente" (confirmado en vivo).
export async function fetchWompiAcceptanceInfo(): Promise<WompiAcceptanceInfo> {
  const { publicKey } = getCredentials();
  const response = await fetch(`${getBaseUrl()}/merchants/info`, {
    headers: { "x-merchant-public-key": publicKey },
  });
  const json = await response.json();
  const presigned = json?.data?.presigned_acceptance;
  if (!response.ok || !presigned?.acceptance_token) {
    throw new Error(
      "No se pudo obtener la información de aceptación de Wompi.",
    );
  }
  const personalAuth = json.data.presigned_personal_data_auth;
  return {
    acceptanceToken: presigned.acceptance_token as string,
    acceptancePermalink: presigned.permalink as string,
    personalAuthToken: personalAuth?.acceptance_token as string | undefined,
    personalAuthPermalink: personalAuth?.permalink as string | undefined,
  };
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

  async confirmPayment(
    intent,
    card,
    customerEmail,
    wompiAcceptance?: WompiAcceptanceTokens,
  ) {
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

    if (!wompiAcceptance?.acceptanceToken) {
      // Nunca debería pasar si el checkout hizo su trabajo (ver
      // checkout-content.tsx: bloquea el submit hasta que se acepten los
      // contratos) — es la misma protección de "no confiar solo en la UI"
      // que ya se aplica en el resto del proyecto (ver lib/auth/authorize.ts).
      return {
        ...intent,
        status: "failed",
        failureReason:
          "Falta aceptar los contratos de Wompi antes de pagar.",
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
          acceptance_token: wompiAcceptance.acceptanceToken,
          accept_personal_auth: wompiAcceptance.personalAuthToken,
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
