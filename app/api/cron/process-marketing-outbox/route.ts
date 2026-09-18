import { NextResponse, type NextRequest } from "next/server";
import { areWritesPaused } from "lib/system/write-pause";
import { processMarketingEventOutboxBatch } from "lib/analytics/marketing-outbox";

// Adaptador HTTP delgado (Fase 2A de analytics) -- mismo esqueleto exacto
// que app/api/cron/process-email-outbox/route.ts: TODA la lógica vive en
// processMarketingEventOutboxBatch (lib/analytics/marketing-outbox.ts), un
// módulo plano sin ningún import de next/server. Esta ruta solo valida
// autorización, valida que las escrituras no estén pausadas, invoca esa
// función y devuelve el resumen.
//
// A propósito NO hay entrada en vercel.json todavía -- mismo motivo que
// process-email-outbox: cualquier scheduler externo (Vercel Cron u otro)
// puede dispararla con un GET + el mismo CRON_SECRET.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (areWritesPaused()) {
    console.error(
      "Cron process-marketing-outbox: escrituras pausadas, corrida omitida.",
    );
    return NextResponse.json({
      skipped: true,
      reason: "Escrituras pausadas temporalmente",
    });
  }

  const summary = await processMarketingEventOutboxBatch();
  return NextResponse.json(summary);
}
