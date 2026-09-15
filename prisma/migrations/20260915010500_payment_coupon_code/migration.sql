-- Cupón ya validado server-side al crear el intent (Sprint 29) — para que
-- createOrderAction sepa qué cupón incrementar sin depender de lo que
-- vuelva a mandar el cliente en el segundo paso del checkout.
ALTER TABLE "Payment" ADD COLUMN "couponCode" TEXT;
