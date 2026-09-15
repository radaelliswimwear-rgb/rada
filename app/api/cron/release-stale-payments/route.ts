import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "lib/prisma";
import { releaseReservedStock } from "lib/checkout/server-order-totals";

// Cron de Vercel (ver vercel.json) — auditoría de seguridad, Sprint 29:
// el stock se reserva atómicamente al crear el intent de pago (ver
// lib/checkout/server-order-totals.ts), y se libera cuando el pago falla,
// se cancela o un webhook lo resuelve. Pero si la clienta simplemente cierra
// la pestaña a mitad de pagar con tarjeta, ninguno de esos tres caminos se
// dispara — el stock quedaría reservado (bloqueado para otras compradoras)
// indefinidamente. Este barrido libera reservas de pagos con tarjeta que
// siguen PENDING después de un tiempo prudente; nunca toca pagos por
// WhatsApp (quedan PENDING a propósito hasta que la fundadora los coordina
// y confirma a mano desde el panel).
//
// STALE_AFTER_MINUTES es el mínimo de antigüedad para considerar una
// reserva abandonada, no una promesa de liberarla apenas se cumplan esos
// 30 minutos: el plan de Vercel de este proyecto (Hobby) solo permite
// correr un cron una vez al día (ver vercel.json) — un cron más frecuente
// hace fallar el despliegue entero. En la práctica, una reserva abandonada
// puede tardar hasta ~24h en liberarse. Pasar a Vercel Pro permite
// correrlo cada 15 minutos si hace falta liberarlas más rápido.
const STALE_AFTER_MINUTES = 30;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const staleBefore = new Date(Date.now() - STALE_AFTER_MINUTES * 60 * 1000);
  const stalePayments = await prisma.payment.findMany({
    where: {
      provider: "WOMPI",
      status: "PENDING",
      stockReleased: false,
      createdAt: { lt: staleBefore },
    },
    select: { id: true },
  });

  let released = 0;
  for (const payment of stalePayments) {
    await releaseReservedStock(payment.id);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "CANCELLED", failureReason: "Reserva expirada (pago nunca confirmado)." },
    });
    released++;
  }

  return NextResponse.json({ released, checked: stalePayments.length });
}
