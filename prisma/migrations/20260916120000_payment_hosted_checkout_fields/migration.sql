-- Checkout Web alojado de Wompi (propuesta/checkout-wompi-alojado):
--   * "checkoutAttemptId": clave de idempotencia del INICIO del pago,
--     generada por el navegador (crypto.randomUUID) y guardada en
--     sessionStorage. El índice único es la garantía real de "un solo
--     intento vigente por checkout" — dos clics simultáneos hacen fallar el
--     segundo INSERT (P2002) en vez de reservar el stock dos veces.
--   * "pendingOrderInput": snapshot server-side (items, dirección, método de
--     envío, guardar dirección, newsletter) de lo que falta para crear el
--     pedido cuando la clienta vuelva de Wompi. Server-side, y no solo en
--     sessionStorage, para que un proceso sin navegador (el cron que
--     verifica pagos vencidos contra Wompi) pueda recuperar un pago
--     realmente APPROVED del que nunca volvió el navegador. Nunca guarda
--     datos de tarjeta.
--
-- Ambas columnas son nullable: los pagos ya existentes, los de WhatsApp y
-- los del proveedor simulado no tienen ninguna de las dos. Postgres permite
-- múltiples NULL en un índice único, así que el índice no los estorba.

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "checkoutAttemptId" TEXT,
ADD COLUMN     "pendingOrderInput" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_checkoutAttemptId_key" ON "Payment"("checkoutAttemptId");
