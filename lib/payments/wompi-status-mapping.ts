import type { Payment as PaymentRow } from "@prisma/client";

// Módulo puro, sin "use server" — payments-actions.ts SÍ tiene "use
// server", y Next.js exige que un archivo con esa directiva solo exporte
// funciones async (Server Actions); exportar una constante corriente
// desde ahí es un error de build real de Next (nunca lo marca `tsc`, que
// no conoce esta restricción — se detectó recién con `next build`).
export const WOMPI_TRANSACTION_STATUS_TO_DB: Record<string, PaymentRow["status"]> = {
  APPROVED: "SUCCEEDED",
  DECLINED: "FAILED",
  VOIDED: "CANCELLED",
  ERROR: "FAILED",
  PENDING: "PENDING",
};
