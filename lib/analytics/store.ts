import { prisma } from "lib/prisma";
import type { Prisma } from "@prisma/client";
import type { AttributionState } from "lib/attribution/types";
import { ANALYTICS_EVENT_NAME_TO_DB } from "./types";
import type { AnalyticsEventInput, DeviceCategory } from "./types";

export type RecordAnalyticsEventInput = AnalyticsEventInput & {
  analyticsSessionId: string | null;
  deviceCategory: DeviceCategory;
  attributionSnapshot: AttributionState | null;
};

// Escritura directa a AnalyticsEvent -- SIEMPRE nuestra propia base, nunca
// una llamada de red externa, así que no necesita outbox/reintentos (a
// diferencia de MarketingEventOutbox, ver lib/analytics/marketing-outbox.ts).
// Asume que el llamador YA decidió que corresponde grabar (gating vive en
// lib/analytics/capture-actions.ts y en el punto de creación del Order,
// nunca acá) -- esta función solo mapea y escribe.
//
// Puede recibir un Prisma.TransactionClient (para escribirse ATÓMICAMENTE
// junto con el Order, ej. el evento purchase) o el cliente global (para el
// resto de eventos, disparados fuera de cualquier transacción de negocio).
export async function recordAnalyticsEvent(
  input: RecordAnalyticsEventInput,
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<void> {
  const products = input.products ?? [];
  const primary = products[0];
  const extraProducts = products.length > 1 ? products.slice(1) : undefined;

  await client.analyticsEvent.create({
    data: {
      // El enum de Prisma usa SCREAMING_CASE; ANALYTICS_EVENT_NAME_TO_DB es
      // la única tabla de traducción (lib/analytics/types.ts).
      eventName: ANALYTICS_EVENT_NAME_TO_DB[input.name] as never,
      analyticsSessionId: input.analyticsSessionId,
      productId: primary?.item_id ?? null,
      variant: primary?.item_variant ?? null,
      quantity: primary?.quantity ?? null,
      value: input.value != null ? Math.round(input.value) : null,
      currency: input.currency ?? "COP",
      path: input.path ?? null,
      deviceCategory: input.deviceCategory,
      attributionSnapshot: (input.attributionSnapshot as object | null) ?? undefined,
      orderId: input.orderId ?? null,
      payload:
        extraProducts || input.custom
          ? { extraProducts, custom: input.custom }
          : undefined,
    },
  });
}
