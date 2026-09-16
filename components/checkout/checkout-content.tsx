"use client";

import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import { WhatsAppIcon } from "components/icons/whatsapp-icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "components/auth/auth-store";
import { useLocalCart } from "components/cart-drawer/cart-store";
import { addressesRepository } from "lib/addresses/addresses-repository";
import { getFreeShippingThresholdAction } from "lib/checkout/free-shipping-actions";
import { calculateCostSummary, qualifiesForFreeShipping } from "lib/checkout/pricing";
import type { ServerOrderItemInput } from "lib/checkout/server-order-totals";
import {
  type ShippingAddressErrors,
  type ShippingAddressInput,
} from "lib/checkout/types";
import { validateShippingAddress } from "lib/checkout/validation";
import { buildWhatsappOrderMessage, buildWhatsappUrl } from "lib/checkout/whatsapp";
import { newsletterRepository } from "lib/newsletter/newsletter-repository";
import { DEFAULT_COUNTRY } from "lib/region/config";
import { ordersRepository } from "lib/orders/orders-repository";
import type { OrderItem, ShippingMethodId } from "lib/orders/types";
import {
  readOrCreateCheckoutAttemptId,
  resetCheckoutAttemptId,
  saveHostedCheckoutHandoff,
} from "lib/checkout/hosted-checkout-session";
import type { PendingOrderInput } from "lib/checkout/pending-order";
import {
  ACTIVE_PAYMENT_PROVIDER,
  IS_SIMULATED_PROVIDER,
} from "lib/payments/config";
import { paymentsRepository } from "lib/payments/payments-repository";
import type { CardInput } from "lib/payments/types";
import type { WompiAcceptanceInfo } from "lib/payments/providers/wompi-gateway";
import { validateCard, type CardErrors } from "lib/payments/validation";
import { CostSummary } from "./cost-summary";
import { CouponInput, type AppliedCoupon } from "./coupon-input";
import { OrderSummary, type OrderSummaryLine } from "./order-summary";
import { PaymentForm, type WompiAcceptedState } from "./payment-form";
import { ShippingAddressForm } from "./shipping-address-form";
import { ShippingMethodSelector } from "./shipping-method-selector";

const EMPTY_ADDRESS: ShippingAddressInput = {
  fullName: "",
  email: "",
  street: "",
  neighborhood: "",
  apartmentDetails: "",
  deliveryNotes: "",
  city: "",
  postalCode: "",
  province: "",
  country: DEFAULT_COUNTRY,
  phone: "",
};

const EMPTY_CARD: CardInput = {
  cardholderName: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
};

// Con el proveedor REAL de Wompi el pago con tarjeta se hace en su Checkout
// Web alojado (checkout.wompi.co): esta tienda no muestra ni recibe número
// de tarjeta ni CVV. El proveedor simulado de desarrollo (stripe-gateway.ts)
// conserva su formulario falso tal cual — ver IS_SIMULATED_PROVIDER en
// lib/payments/config.ts.
const USES_HOSTED_WOMPI_CHECKOUT =
  ACTIVE_PAYMENT_PROVIDER === "wompi" &&
  !IS_SIMULATED_PROVIDER[ACTIVE_PAYMENT_PROVIDER];

export function CheckoutContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { lines, totalAmount, clearCart } = useLocalCart();

  const [shippingAddress, setShippingAddress] =
    useState<ShippingAddressInput>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<ShippingAddressErrors>({});
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethodId>("standard");
  const [saveAddress, setSaveAddress] = useState(false);
  // Sin marcar por defecto — igual criterio que el resto de casillas de
  // consentimiento del sitio (ver registro de cuenta): nunca se asume el
  // "sí", lo elige la clienta.
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"card" | "whatsapp">(
    "card",
  );
  const [card, setCard] = useState<CardInput>(EMPTY_CARD);
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Solo se llena con Wompi activo (ver getWompiAcceptanceInfoAction) — la
  // ley colombiana de Habeas Data exige mostrarle estos contratos al
  // cliente y no dejarlo pagar hasta que los acepte explícitamente.
  const [wompiAcceptanceInfo, setWompiAcceptanceInfo] =
    useState<WompiAcceptanceInfo | null>(null);
  const [wompiAccepted, setWompiAccepted] = useState<WompiAcceptedState>({
    privacy: false,
    personalAuth: false,
  });

  useEffect(() => {
    // Con el checkout alojado no hacen falta: los contratos los muestra y
    // acepta la propia página de Wompi, que es la que crea la transacción.
    if (USES_HOSTED_WOMPI_CHECKOUT) return;
    paymentsRepository.getWompiAcceptanceInfo().then(setWompiAcceptanceInfo);
  }, []);

  // 299900 es el valor por defecto (ver prisma/schema.prisma) — se
  // sobreescribe apenas responde el fetch si el admin cambió el monto en
  // /admin/configuracion.
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(299900);
  useEffect(() => {
    getFreeShippingThresholdAction().then(setFreeShippingThreshold);
  }, []);

  const [isProcessing, setIsProcessing] = useState(false);
  const cancelPaymentRef = useRef(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null,
  );

  const subtotal = totalAmount;
  // El envío no tiene tarifario por ciudad todavía (Sprint 28), así que
  // nunca se cobra en el checkout — arriba del monto de envío gratis queda
  // "Gratis", por debajo queda "por confirmar" (ver CostSummary). Nunca
  // suma al total del pedido. Este `total` es solo lo que se muestra en
  // pantalla mientras la clienta completa el formulario — el monto que de
  // verdad se cobra/reserva sale de createVerifiedIntent, recalculado
  // server-side (ver handleConfirm más abajo).
  const { discount, total } = calculateCostSummary(
    subtotal,
    appliedCoupon?.discount ?? 0,
  );
  const freeShippingUnlocked = qualifiesForFreeShipping(
    subtotal,
    discount,
    freeShippingThreshold,
  );

  const summaryLines = useMemo<OrderSummaryLine[]>(
    () =>
      lines.map((line) => ({
        id: line.id,
        name: line.product.name,
        image: line.product.images[0]!,
        size: line.size,
        quantity: line.quantity,
        priceValue: line.product.priceValue,
        href: `/producto/${line.product.slug}`,
      })),
    [lines],
  );

  if (lines.length === 0 && !isProcessing) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 py-20 text-center">
        <ShoppingBagIcon className="h-8 w-8 text-neutral-400" />
        <p className="text-sm text-neutral-500">Tu carrito está vacío.</p>
        <Link
          href="/"
          className="mt-2 rounded-full bg-brand-coral px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-crimson"
        >
          Ir a comprar
        </Link>
      </div>
    );
  }

  const handleConfirm = async () => {
    const addressErrors = validateShippingAddress(shippingAddress);
    // Con el checkout alojado no hay tarjeta que validar acá: esos campos ni
    // se muestran (ver PaymentForm) y la Server Action tampoco los acepta.
    const cardValidationErrors =
      paymentMethod === "card" && !USES_HOSTED_WOMPI_CHECKOUT
        ? validateCard(card)
        : {};
    setErrors(addressErrors);
    setCardErrors(cardValidationErrors);
    setPaymentError(null);

    if (
      Object.keys(addressErrors).length > 0 ||
      Object.keys(cardValidationErrors).length > 0
    ) {
      toast("Revisá los datos de envío y de pago.");
      return;
    }

    if (
      paymentMethod === "card" &&
      !USES_HOSTED_WOMPI_CHECKOUT &&
      wompiAcceptanceInfo
    ) {
      const missingPersonalAuth =
        wompiAcceptanceInfo.personalAuthToken && !wompiAccepted.personalAuth;
      if (!wompiAccepted.privacy || missingPersonalAuth) {
        toast("Aceptá los contratos de Wompi para continuar.");
        return;
      }
    }

    cancelPaymentRef.current = false;
    setIsProcessing(true);

    // El servidor recalcula precio/descuento/cupón/stock a partir de
    // productId+size+quantity — nunca del `total` que ya calculó este
    // componente para mostrarlo en pantalla (ver
    // lib/checkout/server-order-totals.ts). Auditoría de seguridad, Sprint 29.
    const checkoutItems: ServerOrderItemInput[] = lines.map((line) => ({
      productId: line.productId,
      size: line.size,
      quantity: line.quantity,
    }));

    if (paymentMethod === "whatsapp") {
      try {
        const verified = await paymentsRepository.createVerifiedWhatsappIntent(
          checkoutItems,
          appliedCoupon?.code ?? null,
        );
        if (!verified.success) {
          toast(verified.error);
          return;
        }
        const { intent, total: verifiedTotal } = verified;

        const items: OrderItem[] = lines.map((line) => ({
          productId: line.productId,
          name: line.product.name,
          image: line.product.images[0]!,
          size: line.size,
          quantity: line.quantity,
          priceValue: line.product.priceValue,
          sku: line.product.sku,
        }));

        const order = await ordersRepository.create({
          items,
          shippingAddress,
          shippingMethod,
          payment: {
            provider: "whatsapp",
            transactionId: intent.id,
            last4: "",
          },
          status: "Pendiente de pago",
        });

        if (user && saveAddress) {
          await addressesRepository.create({
            ...shippingAddress,
            label: "Envío",
            isDefault: false,
          });
        }
        if (subscribeNewsletter) {
          await newsletterRepository.subscribe(shippingAddress.email);
        }

        await clearCart();
        const message = buildWhatsappOrderMessage(items, verifiedTotal);
        window.open(buildWhatsappUrl(message), "_blank");
        router.push(`/checkout/confirmacion/${order.id}`);
      } catch {
        toast("No pudimos generar el pedido. Intentá de nuevo.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Checkout Web ALOJADO de Wompi: el navegador sale COMPLETO de la tienda
    // (nada de iframe ni popup — es lo que pide Wompi) y vuelve a
    // /checkout/wompi/retorno con "?id=<transacción>". Lo que falta para
    // crear el pedido queda guardado de los dos lados: en sessionStorage
    // para el camino feliz, y server-side en Payment.pendingOrderInput (lo
    // hace startWompiHostedCheckout) para que el pedido se pueda recuperar
    // aunque el navegador no vuelva nunca.
    if (USES_HOSTED_WOMPI_CHECKOUT) {
      try {
        const pendingOrder: PendingOrderInput = {
          items: lines.map((line) => ({
            productId: line.productId,
            name: line.product.name,
            image: line.product.images[0]!,
            size: line.size,
            quantity: line.quantity,
            priceValue: line.product.priceValue,
            sku: line.product.sku,
          })),
          shippingAddress,
          shippingMethod,
          saveAddress,
          subscribeNewsletter,
        };

        let attemptId = readOrCreateCheckoutAttemptId();
        let started = await paymentsRepository.startWompiHostedCheckout(
          checkoutItems,
          appliedCoupon?.code ?? null,
          attemptId,
          pendingOrder,
        );
        // `restart` = el intento que quedó guardado en esta pestaña ya no
        // sirve (venció, o el carrito cambió). Se genera uno nuevo y se
        // reintenta UNA sola vez; nunca en bucle.
        if (!started.success && started.restart) {
          resetCheckoutAttemptId();
          attemptId = readOrCreateCheckoutAttemptId();
          started = await paymentsRepository.startWompiHostedCheckout(
            checkoutItems,
            appliedCoupon?.code ?? null,
            attemptId,
            pendingOrder,
          );
        }
        if (!started.success) {
          setPaymentError(started.error);
          toast(started.error);
          setIsProcessing(false);
          return;
        }

        saveHostedCheckoutHandoff({
          checkoutAttemptId: attemptId,
          reference: started.reference,
          pendingOrder,
        });
        // El carrito NO se vacía todavía: el pedido recién existe cuando el
        // pago está aprobado de verdad (ver /checkout/wompi/retorno). Si la
        // clienta abandona el pago, su carrito sigue intacto.
        window.location.href = started.checkoutUrl;
      } catch {
        toast("No pudimos iniciar el pago con Wompi. Intentá de nuevo.");
        setIsProcessing(false);
      }
      return;
    }

    try {
      const verified = await paymentsRepository.createVerifiedIntent(
        checkoutItems,
        appliedCoupon?.code ?? null,
      );
      if (!verified.success) {
        setPaymentError(verified.error);
        toast(verified.error);
        return;
      }
      const { intent } = verified;

      const confirmed = await paymentsRepository.confirmPayment(
        intent,
        card,
        shippingAddress.email,
        wompiAcceptanceInfo
          ? {
              acceptanceToken: wompiAcceptanceInfo.acceptanceToken,
              personalAuthToken: wompiAcceptanceInfo.personalAuthToken,
            }
          : undefined,
      );

      if (cancelPaymentRef.current) {
        await paymentsRepository.cancel(intent.id);
        toast("Pago cancelado.");
        return;
      }

      if (confirmed.status !== "succeeded") {
        setPaymentError(
          confirmed.failureReason ??
            "El pago no pudo procesarse. Probá con otra tarjeta.",
        );
        toast("El pago fue rechazado.");
        return;
      }

      const items: OrderItem[] = lines.map((line) => ({
        productId: line.productId,
        name: line.product.name,
        image: line.product.images[0]!,
        size: line.size,
        quantity: line.quantity,
        priceValue: line.product.priceValue,
        sku: line.product.sku,
      }));

      const order = await ordersRepository.create({
        items,
        shippingAddress,
        shippingMethod,
        payment: {
          provider: confirmed.provider,
          transactionId: confirmed.id,
          last4: card.cardNumber.replace(/\s/g, "").slice(-4),
        },
      });

      if (user && saveAddress) {
        await addressesRepository.create({
          ...shippingAddress,
          label: "Envío",
          isDefault: false,
        });
      }
      if (subscribeNewsletter) {
        await newsletterRepository.subscribe(shippingAddress.email);
      }

      await clearCart();
      router.push(`/checkout/confirmacion/${order.id}`);
    } catch {
      toast("No pudimos procesar el pedido. Intentá de nuevo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPayment = () => {
    cancelPaymentRef.current = true;
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-10">
        <section>
          <h2 className="mb-4 text-lg font-semibold">1. Resumen del pedido</h2>
          <OrderSummary lines={summaryLines} />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">2. Dirección de envío</h2>
          <ShippingAddressForm
            value={shippingAddress}
            errors={errors}
            onChange={setShippingAddress}
            saveAddress={saveAddress}
            onSaveAddressChange={setSaveAddress}
            subscribeNewsletter={subscribeNewsletter}
            onSubscribeNewsletterChange={setSubscribeNewsletter}
          />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">3. Método de envío</h2>
          <ShippingMethodSelector
            selected={shippingMethod}
            onChange={setShippingMethod}
          />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">4. Pago</h2>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              disabled={isProcessing}
              className={`rounded-md border px-4 py-2.5 text-sm transition-colors duration-200 ${
                paymentMethod === "card"
                  ? "border-brand-crimson bg-brand-crimson text-white"
                  : "border-neutral-300 text-neutral-600"
              }`}
            >
              Pagar online
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("whatsapp")}
              disabled={isProcessing}
              className={`flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-colors duration-200 ${
                paymentMethod === "whatsapp"
                  ? "border-brand-crimson bg-brand-crimson text-white"
                  : "border-neutral-300 text-neutral-600"
              }`}
            >
              <WhatsAppIcon className="h-4 w-4" />
              Continuar por WhatsApp
            </button>
          </div>

          {paymentMethod === "card" ? (
            <PaymentForm
              value={card}
              errors={cardErrors}
              onChange={setCard}
              disabled={isProcessing}
              wompiAcceptanceInfo={wompiAcceptanceInfo}
              wompiAccepted={wompiAccepted}
              onWompiAcceptedChange={setWompiAccepted}
              hostedCheckout={USES_HOSTED_WOMPI_CHECKOUT}
            />
          ) : (
            <p className="rounded-md border border-neutral-200 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
              Te llevamos a WhatsApp con el detalle de tu pedido y el total
              para coordinar el pago directamente con nosotros.
            </p>
          )}
        </section>
      </div>

      <aside className="h-fit rounded-xl border border-neutral-200 p-5 lg:sticky lg:top-24 dark:border-neutral-800">
        <h2 className="mb-4 text-lg font-semibold">Resumen de costos</h2>
        <div className="mb-4">
          <CouponInput
            subtotal={subtotal}
            applied={appliedCoupon}
            onApply={setAppliedCoupon}
            onRemove={() => setAppliedCoupon(null)}
          />
        </div>
        <CostSummary
          subtotal={subtotal}
          discount={discount}
          total={total}
          freeShippingThreshold={freeShippingThreshold}
          qualifiesForFreeShipping={freeShippingUnlocked}
        />
        {paymentError ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
            {paymentError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isProcessing}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-coral p-4 text-sm font-medium tracking-wide text-white transition-colors duration-200 hover:bg-brand-crimson disabled:opacity-50"
        >
          {isProcessing ? (
            "Procesando..."
          ) : paymentMethod === "whatsapp" ? (
            <>
              <WhatsAppIcon className="h-4 w-4" />
              Continuar por WhatsApp
            </>
          ) : USES_HOSTED_WOMPI_CHECKOUT ? (
            "Pagar con Wompi"
          ) : (
            "Pagar y confirmar pedido"
          )}
        </button>
        {/* "Cancelar pago" solo tiene sentido en el flujo viejo, que espera
            la respuesta del cobro dentro de esta misma página. Con el
            checkout alojado, en cuanto se presiona el botón el navegador se
            va a Wompi: no hay nada que cancelar de este lado. */}
        {isProcessing &&
        paymentMethod === "card" &&
        !USES_HOSTED_WOMPI_CHECKOUT ? (
          <button
            type="button"
            onClick={handleCancelPayment}
            className="mt-3 w-full text-center text-xs text-neutral-500 underline-offset-4 hover:underline"
          >
            Cancelar pago
          </button>
        ) : null}
      </aside>
    </div>
  );
}
