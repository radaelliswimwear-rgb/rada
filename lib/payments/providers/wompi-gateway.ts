import { createHash } from "node:crypto";
import type { PaymentGateway } from "../types";
import { assertWompiConfigConsistencyOrThrow } from "../guard-real-payments";

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
  // Hardening P2/P3 (sep. 2026): antes de devolver credenciales utilizables,
  // confirma que apuntan al MISMO entorno que WOMPI_BASE_URL/
  // NEXT_PUBLIC_WOMPI_SANDBOX/APP_ENVIRONMENT ya declaran -- ver el
  // comentario largo junto a assertWompiConfigConsistencyOrThrow
  // (lib/payments/guard-real-payments.ts). Este es el único punto por el
  // que pasan todas las llamadas reales a Wompi, así que alcanza con
  // llamarlo acá una sola vez.
  assertWompiConfigConsistencyOrThrow({
    baseUrl: getBaseUrl(),
    publicKey,
    privateKey,
  });
  return { publicKey, privateKey, integritySecret };
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export type WompiTransaction = {
  id: string;
  status: string;
  status_message?: string;
  amount_in_cents?: number;
  currency?: string;
  reference?: string;
  // Solo para mostrar "•••• 1234" en la confirmación: con el Checkout Web
  // alojado, los últimos 4 dígitos llegan desde la transacción ya cobrada
  // (nunca desde un formulario propio). Opcional a propósito — un pago por
  // otro medio (PSE, Nequi, Bancolombia) no trae ninguno.
  payment_method?: {
    type?: string;
    extra?: { last_four?: string };
  };
};

export function buildIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string,
  expirationTime?: string,
): string {
  // Fórmula documentada por Wompi: SHA-256 de la concatenación
  // referencia + monto_en_centavos + moneda + secreto_de_integridad.
  // Cuando se usa expiration-time, Wompi exige concatenarlo como valor
  // adicional ANTES del secreto (referencia+monto+moneda+expiration+secreto)
  // — ver "Step 3: Generate an integrity signature" en
  // docs.wompi.co/en/docs/colombia/widget-checkout-web. Si no se pasa
  // expirationTime, la firma queda igual que antes (4 valores).
  const expirationSegment = expirationTime ?? "";
  return createHash("sha256")
    .update(
      `${reference}${amountInCents}${currency}${expirationSegment}${integritySecret}`,
    )
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
  if (!response.ok || !json?.data?.id) {
    throw new Error(
      `Wompi no devolvió la transacción ${transactionId} (status ${response.status}).`,
    );
  }
  return json.data as WompiTransaction;
}

// Re-verificación server-a-server de un evento de webhook (auditoría de
// seguridad, Sprint 29): antes, el webhook confiaba ciegamente en el
// `status` que venía dentro del payload firmado — bastaba con que alguien
// conociera (o comprometiera) WOMPI_EVENTS_SECRET para poder "aprobar"
// cualquier transacción con un evento fabricado. Esta llamada usa la
// llave PRIVADA (un secreto distinto al de eventos) para preguntarle
// directo a la API de Wompi el estado real de esa transacción — dos
// secretos independientes tienen que estar comprometidos a la vez para
// falsear un pago, no uno solo.
export async function verifyWompiTransaction(
  transactionId: string,
): Promise<WompiTransaction> {
  const { privateKey } = getCredentials();
  return fetchTransaction(transactionId, privateKey);
}

// NO agregar acá una función que le pase una `reference` a este mismo
// endpoint asumiendo que Wompi la acepta donde espera un id de
// transacción. Se intentó documentar esa suposición (basada en una
// lectura no concluyente de la documentación pública, nunca confirmada
// contra una respuesta real de Wompi) y se retiró — ver
// lib/payments/reconciliation.ts para el estado real de este problema:
// hoy no hay ningún contrato oficialmente confirmado para encontrar una
// transacción de Wompi a partir de nuestra propia `reference` cuando
// nunca llegó ningún webhook que nos diera el id real de Wompi.

// --------------------------------------------------------------------------
// Checkout Web ALOJADO de Wompi (propuesta/checkout-wompi-alojado)
// --------------------------------------------------------------------------
// Reemplaza la tokenización server-side de tarjetas que hacía este mismo
// archivo (POST /tokens/cards + POST /transactions con el PAN y el CVV
// pasando por ESTE servidor). Con el checkout alojado, el navegador sale
// completo hacia checkout.wompi.co y los datos de la tarjeta se escriben en
// el dominio de Wompi: este servidor nunca los ve, ni en memoria ni en un
// log. Eso saca a la tienda del alcance de cumplimiento PCI que tenía el
// formulario propio — que era el motivo real del cambio, no un detalle de
// estilo.
//
// El contrato es un GET con parámetros (un <form method="GET"> o la URL
// equivalente). Requeridos: public-key, currency, amount-in-cents,
// reference, signature:integrity. Opcionales que sí usamos: redirect-url,
// expiration-time, customer-data:email.
export const WOMPI_HOSTED_CHECKOUT_URL = "https://checkout.wompi.co/p/";

// Nótese lo que NO está acá: ningún campo de tarjeta. No es una omisión que
// haya que recordar respetar — el tipo no los admite, así que un intento de
// mandar un PAN por esta vía no compila (ver
// wompi-hosted-checkout.no-card-data.test.ts).
export type WompiHostedCheckoutInput = {
  reference: string;
  amountInCents: number;
  currency: string;
  redirectUrl: string;
  customerEmail?: string;
  /** ISO8601 en UTC, ej. "2026-09-16T18:30:00.000Z". */
  expirationTime?: string;
};

// Wompi cobra en "centavos" aunque el peso colombiano no los use en la
// práctica (ver lib/currency/subunits.ts: internamente guardamos pesos
// enteros). La conversión vive solo acá, en el borde del adaptador.
export function toWompiAmountInCents(amount: number): number {
  return toCents(amount);
}

export function buildWompiHostedCheckoutParams(
  input: WompiHostedCheckoutInput,
): Record<string, string> {
  const { publicKey, integritySecret } = getCredentials();

  if (!input.reference) {
    throw new Error("Falta la referencia del pago para el checkout de Wompi.");
  }
  if (!Number.isInteger(input.amountInCents) || input.amountInCents <= 0) {
    throw new Error(
      "El monto para el checkout de Wompi debe ser un entero de centavos mayor a cero.",
    );
  }

  const params: Record<string, string> = {
    "public-key": publicKey,
    currency: input.currency,
    "amount-in-cents": String(input.amountInCents),
    reference: input.reference,
    // Misma fórmula (y misma función) que ya usaba la creación de
    // transacciones server-side: SHA-256 de
    // referencia + monto_en_centavos + moneda + secreto_de_integridad.
    "signature:integrity": buildIntegritySignature(
      input.reference,
      input.amountInCents,
      input.currency,
      integritySecret,
      input.expirationTime,
    ),
    "redirect-url": input.redirectUrl,
  };
  if (input.customerEmail) params["customer-data:email"] = input.customerEmail;
  if (input.expirationTime) params["expiration-time"] = input.expirationTime;
  return params;
}

export function buildWompiHostedCheckoutUrl(
  input: WompiHostedCheckoutInput,
): string {
  const search = new URLSearchParams(buildWompiHostedCheckoutParams(input));
  return `${WOMPI_HOSTED_CHECKOUT_URL}?${search.toString()}`;
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

  // Queda declarado porque el contrato PaymentGateway lo exige, pero con
  // Wompi real este servidor YA NO acepta datos de tarjeta. El cobro con
  // tarjeta pasa por el Checkout Web alojado (ver
  // buildWompiHostedCheckoutUrl arriba y startWompiHostedCheckoutAction en
  // lib/payments/payments-actions.ts).
  //
  // Antes, acá se tokenizaba el PAN y el CVV contra /tokens/cards y se
  // creaba la transacción desde este servidor — o sea, el número completo
  // de la tarjeta y su código de seguridad pasaban por esta aplicación en
  // CADA intento de pago. Eso es exactamente lo que este cambio elimina, y
  // por eso el camino viejo se corta acá en vez de dejarse "por las
  // dudas": si alguien llama la Server Action vieja directo con un número
  // de tarjeta (saltándose la UI), el intento se rechaza y esos datos no se
  // reenvían a ningún lado ni se guardan. El adaptador simulado de Stripe
  // (providers/stripe-gateway.ts, para desarrollo) no cambia.
  async confirmPayment(intent) {
    console.error(
      "wompiGateway.confirmPayment: llamada al flujo viejo de tarjeta propia — rechazada (con Wompi el cobro va por el Checkout Web alojado).",
    );
    return {
      ...intent,
      status: "failed",
      failureReason:
        "El pago con tarjeta se completa en la página segura de Wompi. Volvé al checkout y usá el botón para pagar con Wompi.",
    };
  },
};
