import { NextResponse, type NextRequest } from "next/server";
import { areWritesPaused } from "lib/system/write-pause";
import { processEmailOutboxBatch } from "lib/email/outbox";

// Adaptador HTTP delgado (Sprint de confiabilidad de emails / portabilidad
// de hosting) — TODA la lógica de negocio vive en processEmailOutboxBatch
// (lib/email/outbox.ts), un módulo plano sin ningún import de next/server
// ni de nada específico de Vercel. Esta ruta solo: valida autorización,
// valida que las escrituras no estén pausadas, invoca esa función, y
// devuelve el resumen como JSON — el mismo esqueleto que ya usa
// app/api/cron/release-stale-payments/route.ts para pagos vencidos.
//
// A propósito NO hay ninguna entrada en vercel.json todavía: el hosting
// final de Radaelli Swimwear no está decidido (ver auditoría de
// portabilidad). Esta ruta es un GET protegido por bearer token — cualquier
// scheduler externo que pueda hacer esa petición HTTP puede dispararla:
// Vercel Cron, Railway Cron, Render Cron Jobs, un crontab de una VM
// (Fly.io/AWS), o un workflow programado de GitHub Actions. El día que se
// decida el hosting final, conectarla es solo configuración del scheduler
// de esa plataforma apuntando a esta URL con el mismo CRON_SECRET — cero
// cambios de código.
//
// Si algún día se usa Vercel Cron, la entrada en vercel.json sería:
//   { "path": "/api/cron/process-email-outbox", "schedule": "<a decidir>" }
// La frecuencia depende del hosting final, no de esta ruta.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (areWritesPaused()) {
    console.error(
      "Cron process-email-outbox: escrituras pausadas, corrida omitida.",
    );
    return NextResponse.json({
      skipped: true,
      reason: "Escrituras pausadas temporalmente",
    });
  }

  const summary = await processEmailOutboxBatch();
  return NextResponse.json(summary);
}
