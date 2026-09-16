import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "lib/auth/rate-limit";
import { getClientIp } from "lib/request/client-ip";
import { paymentsRepository } from "lib/payments/payments-repository";
import type { WompiWebhookTransaction } from "lib/payments/payments-actions";
import { areWritesPaused } from "lib/system/write-pause";

// Webhook de Wompi (Sprint 16, endurecido en el Sprint 29): notifica
// cambios de estado de una transacción (aprobada, rechazada, anulada) de
// forma asincrónica — hace falta para pagos que no se resuelven en el mismo
// request de creación (ver el reintento corto en
// lib/payments/providers/wompi-gateway.ts).
//
// La verificación de firma sigue el algoritmo documentado por Wompi
// (SHA-256 de los valores de `signature.properties`, en orden, más
// `timestamp` y el secreto de eventos) — confirmado contra
// docs.wompi.co/docs/colombia/eventos vigente al Sprint 29. Pero la firma
// sola ya no alcanza para aplicar un evento: applyWompiWebhookUpdateAction
// (lib/payments/payments-actions.ts) además rechaza eventos repetidos/fuera
// de orden, rechaza si el monto no coincide con lo cobrado de verdad, y
// re-verifica la transacción en vivo contra la API de Wompi antes de
// confiar en el status del payload.
function readPath(source: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      source,
    );
}

function isValidSignature(body: {
  data?: unknown;
  signature?: { properties?: string[]; checksum?: string };
  timestamp?: number;
}): boolean {
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
  const properties = body.signature?.properties;
  const checksum = body.signature?.checksum;
  if (
    !eventsSecret ||
    !properties ||
    !checksum ||
    body.timestamp === undefined
  ) {
    return false;
  }

  // `signature.properties` (ej. "transaction.id") son rutas relativas a
  // `data`, no a la raíz del evento — resolverlas contra `body` directo
  // siempre daba `undefined` y el checksum nunca podía coincidir.
  const concatenated = properties
    .map((path) => String(readPath(body.data, path) ?? ""))
    .join("");
  const expected = createHash("sha256")
    .update(`${concatenated}${body.timestamp}${eventsSecret}`)
    .digest("hex");

  // Comparación en tiempo constante: un === directo entre dos strings de
  // largo variable puede filtrar, por cuánto tarda en responder, cuántos
  // caracteres iniciales coincidieron — una vía de ataque de temporización
  // teórica pero innecesaria de dejar abierta en una firma criptográfica.
  const expectedBuffer = Buffer.from(expected.toLowerCase(), "utf8");
  const checksumBuffer = Buffer.from(checksum.toLowerCase(), "utf8");
  if (expectedBuffer.length !== checksumBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, checksumBuffer);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Chequeo PRIMERO, antes de rate limiting: checkRateLimit hace su propia
  // escritura de bookkeeping (lib/auth/rate-limit.ts) contra el mismo
  // cliente Prisma — con escrituras pausadas, esa escritura lanzaría
  // WritesPausedError, y el catch genérico de más abajo lo hubiera
  // reportado como "Demasiadas peticiones" (429), ocultando la razón real.
  // Encontrado probando esto por HTTP contra datos ficticios, no asumido.
  if (areWritesPaused()) {
    console.error(
      "Webhook de Wompi: escrituras pausadas, request rechazado antes de procesar (se espera reintento de Wompi)",
    );
    return NextResponse.json(
      { received: false, reason: "Escrituras pausadas temporalmente" },
      { status: 503 },
    );
  }

  try {
    await checkRateLimit(await getClientIp(), "webhook");
  } catch {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  if (!isValidSignature(body)) {
    console.error(
      "Webhook de Wompi: firma inválida o secreto no configurado, evento descartado",
    );
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const data = (body as { data?: { transaction?: Record<string, unknown> } })
    .data?.transaction;
  const timestamp = (body as { timestamp?: unknown }).timestamp;

  const isCompleteTransaction =
    data &&
    typeof data.reference === "string" &&
    typeof data.status === "string" &&
    typeof data.id === "string" &&
    typeof data.amount_in_cents === "number" &&
    typeof data.currency === "string" &&
    typeof timestamp === "number";

  if (isCompleteTransaction && data) {
    // El chequeo de pausa ya se hizo al principio de la función, antes de
    // rate limiting — acá ya sabemos que las escrituras no están pausadas.
    const transaction: WompiWebhookTransaction = {
      id: data.id as string,
      reference: data.reference as string,
      status: data.status as string,
      statusMessage:
        typeof data.status_message === "string" ? data.status_message : null,
      amountInCents: data.amount_in_cents as number,
      currency: data.currency as string,
    };
    await paymentsRepository.applyWompiWebhookUpdate(
      transaction,
      timestamp as number,
    );
  } else {
    // Se loguean solo campos puntuales, nunca el payload completo — un
    // evento de Wompi puede traer email/monto/otros datos de la
    // transacción, y no hace falta el cuerpo entero para diagnosticar un
    // evento con forma inesperada.
    console.error(
      "Webhook de Wompi: evento con forma inesperada, ignorado",
      { event: (body as { event?: unknown }).event, reference: data?.reference },
    );
  }

  // Siempre 200 con firma válida (Wompi reintenta si no recibe 200) — un
  // evento con forma inesperada se loguea pero no debe generar reintentos
  // infinitos.
  return NextResponse.json({ received: true });
}
