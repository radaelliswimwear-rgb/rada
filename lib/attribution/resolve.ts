import { shouldFreezeAttributionForPayment } from "./state";
import { readAttributionCookie } from "./cookie";
import type { AttributionState } from "./types";

// Llamado desde los 3 puntos donde hoy se crea un Payment real
// (lib/payments/payments-actions.ts), en el mismo momento y con el mismo
// criterio que ya se usa para originalUserId/marketingExclusionReason: es
// la única vez que este código corre dentro de un request real del
// navegador, con su cookie de atribución disponible -- el webhook/return/
// cron que confirman el pago después nunca la tienen (por eso el snapshot
// se congela ACÁ, no se reconstruye después).
//
// "ANALYTICS MUST FAIL OPEN FOR COMMERCE" (ver reporte): un error leyendo o
// parseando la cookie de atribución nunca debe impedir crear el Payment --
// se loguea server-side y se sigue sin atribución para ESTE pago, nunca se
// relanza el error hacia el checkout.
export async function resolvePaymentAttributionSnapshot(
  marketingExclusionReason: string | null,
): Promise<AttributionState | undefined> {
  if (!shouldFreezeAttributionForPayment(marketingExclusionReason)) {
    return undefined; // tráfico interno / compra de prueba: sin atribución comercial
  }
  try {
    const state = await readAttributionCookie();
    return state ?? undefined;
  } catch (error) {
    console.error(
      "resolvePaymentAttributionSnapshot: no se pudo leer la atribución, se sigue sin ella",
      error,
    );
    return undefined;
  }
}
