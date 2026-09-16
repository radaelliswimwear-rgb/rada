-- Correcciones al cron de pagos vencidos (release-stale-payments):
--   * "originalUserId": id de la cuenta con sesión iniciada en el momento
--     REAL en que se inició un checkout con Wompi (capturado en
--     startWompiHostedCheckoutAction leyendo getCurrentUser() dentro de ese
--     mismo request). Sin esto, recuperar un pedido desde el cron (que no
--     tiene ninguna sesión) asignaba siempre la cuenta invitada, aunque la
--     clienta real hubiera estado logueada — perdía su pedido de "Mis
--     pedidos" en silencio. Null es una compra de invitada legítima.
--   * "flaggedForReviewAt": marca de "esto necesita revisión manual",
--     puesta por el cron cuando encuentra un pago vencido del que nunca
--     llegó ningún evento de Wompi (sin wompiTransactionId no hay ningún
--     contrato confirmado para preguntarle nada) — en ese caso el pago ya
--     NO se cancela ni se libera stock automáticamente.
--
-- Ambas nullable: los pagos ya existentes, los de WhatsApp/simulados y
-- cualquier pago que nunca necesitó ninguna de las dos no tienen ninguna.
--
-- PENDIENTE: probar contra un proyecto Neon descartable antes de esta
-- entrega (en curso) -- nunca contra ORIGIN ni DESTINATION.

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "flaggedForReviewAt" TIMESTAMP(3),
ADD COLUMN     "originalUserId" TEXT;
