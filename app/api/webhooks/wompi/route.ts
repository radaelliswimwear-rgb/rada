import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { paymentsRepository } from "lib/payments/payments-repository";

// Webhook de Wompi (Sprint 16): notifica cambios de estado de una
// transacción (aprobada, rechazada, anulada) de forma asincrónica — hace
// falta para pagos que no se resuelven en el mismo request de creación
// (ver el reintento corto en lib/payments/providers/wompi-gateway.ts).
//
// No verificado contra eventos reales de Wompi en este entorno (no hay
// WOMPI_EVENTS_SECRET configurado) — ver docs/sprints/SPRINT-16.md. La
// verificación de firma sigue el algoritmo documentado por Wompi
// (SHA-256 de los valores de `signature.properties`, en orden, más
// `timestamp` y el secreto de eventos), pero no hay forma de confirmar acá
// que coincide byte a byte con lo que Wompi realmente envía sin credenciales
// reales para provocar un evento de prueba.
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

  return expected.toLowerCase() === checksum.toLowerCase();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  const transaction = (
    body as { data?: { transaction?: Record<string, unknown> } }
  ).data?.transaction;
  const reference = transaction?.reference;
  const status = transaction?.status;

  if (typeof reference === "string" && typeof status === "string") {
    await paymentsRepository.applyWompiWebhookUpdate(
      reference,
      status,
      typeof transaction?.status_message === "string"
        ? transaction.status_message
        : null,
    );
  } else {
    console.error(
      "Webhook de Wompi: evento sin transaction.reference/status, ignorado",
      body,
    );
  }

  // Siempre 200 con firma válida (Wompi reintenta si no recibe 200) — un
  // evento con forma inesperada se loguea pero no debe generar reintentos
  // infinitos.
  return NextResponse.json({ received: true });
}
