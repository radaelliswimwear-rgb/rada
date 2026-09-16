import { prisma } from "lib/prisma";
import { areWritesPaused } from "lib/system/write-pause";
import { findWompiTransactionByReference } from "lib/payments/providers/wompi-gateway";
import { applyWompiWebhookUpdateAction } from "lib/payments/payments-actions";
import type { WompiWebhookTransaction } from "lib/payments/payments-actions";

// Conciliación de pagos Wompi tras una pausa de escrituras (o cualquier
// corte de red/tiempo en el que el webhook no haya llegado o no se haya
// podido aplicar). Deliberadamente NO se apoya solo en los logs del 503
// de escrituras pausadas — un log de Vercel no es una cola durable ni
// prueba de que un pago se procesó, y además hay pagos que pueden quedar
// pendientes sin que NINGÚN webhook haya llegado nunca (falla de red del
// lado de Wompi, timeout, lo que sea). Los candidatos salen directamente
// de lo persistido en Payment, no de un registro de eventos.
//
// Reutiliza applyWompiWebhookUpdateAction (el mismo camino que usa el
// webhook real) en vez de duplicar su lógica: eso significa que esta
// conciliación hereda gratis sus chequeos existentes (rechaza eventos más
// viejos que el último aplicado, valida monto/moneda contra lo cobrado
// server-side) — correrla dos veces sobre el mismo pago, o que corra
// justo cuando un webhook real recién lo actualizó, es seguro por
// construcción: si el estado consultado no es más nuevo que el ya
// aplicado, applyWompiWebhookUpdateAction simplemente no hace nada.
export type ResultadoConciliacion = {
  candidatos: number;
  actualizados: number;
  sinCambios: number;
  errores: { providerRef: string; error: string }[];
};

export async function reconcilePendingWompiPayments(): Promise<ResultadoConciliacion> {
  if (areWritesPaused()) {
    throw new Error(
      "No se puede conciliar con las escrituras todavía pausadas — la conciliación necesita escribir el resultado.",
    );
  }

  // Candidatos: CUALQUIER pago Wompi que siga en un estado no final,
  // exista o no un log de un intento fallido — cubre tanto "recibió un
  // 503 durante la pausa" como "nunca recibió ningún webhook".
  const candidatos = await prisma.payment.findMany({
    where: { provider: "WOMPI", status: "PENDING" },
  });

  const resultado: ResultadoConciliacion = {
    candidatos: candidatos.length,
    actualizados: 0,
    sinCambios: 0,
    errores: [],
  };

  for (const payment of candidatos) {
    try {
      const estadoAutoritativo = await findWompiTransactionByReference(
        payment.providerRef,
      );

      if (
        !estadoAutoritativo.reference ||
        estadoAutoritativo.amount_in_cents === undefined ||
        !estadoAutoritativo.currency
      ) {
        resultado.errores.push({
          providerRef: payment.providerRef,
          error: "Respuesta de Wompi incompleta — no se pudo reconciliar este pago automáticamente.",
        });
        continue;
      }

      const transaccion: WompiWebhookTransaction = {
        id: estadoAutoritativo.id,
        reference: estadoAutoritativo.reference,
        status: estadoAutoritativo.status,
        statusMessage: estadoAutoritativo.status_message ?? null,
        amountInCents: estadoAutoritativo.amount_in_cents,
        currency: estadoAutoritativo.currency,
      };

      // "Ahora" como marca de tiempo del evento de conciliación: siempre
      // debe ganarle a cualquier lastEventTimestamp guardado antes (es,
      // por definición, la consulta más reciente que existe) — el propio
      // applyWompiWebhookUpdateAction descarta esto si en el medio ya
      // llegó un webhook real más nuevo, así que no hay riesgo de pisar
      // un estado más actualizado.
      const antes = await prisma.payment.findUnique({
        where: { id: payment.id },
        select: { status: true },
      });
      await applyWompiWebhookUpdateAction(
        transaccion,
        Math.floor(Date.now() / 1000),
      );
      const despues = await prisma.payment.findUnique({
        where: { id: payment.id },
        select: { status: true },
      });

      if (antes?.status !== despues?.status) {
        resultado.actualizados++;
      } else {
        resultado.sinCambios++;
      }
    } catch (error) {
      resultado.errores.push({
        providerRef: payment.providerRef,
        error: (error as Error).message,
      });
    }
  }

  return resultado;
}
