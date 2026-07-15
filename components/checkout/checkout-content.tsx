"use client";

import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "components/auth/auth-store";
import { useLocalCart } from "components/cart-drawer/cart-store";
import { addressesRepository } from "lib/addresses/addresses-repository";
import { getShippingCost } from "lib/checkout/shipping-methods";
import { calculateCostSummary } from "lib/checkout/pricing";
import {
  GUEST_USER_ID,
  type ShippingAddressErrors,
  type ShippingAddressInput,
} from "lib/checkout/types";
import { validateShippingAddress } from "lib/checkout/validation";
import { ordersRepository } from "lib/orders/orders-repository";
import type { OrderItem, ShippingMethodId } from "lib/orders/types";
import { paymentsRepository } from "lib/payments/payments-repository";
import type { CardInput } from "lib/payments/types";
import { validateCard, type CardErrors } from "lib/payments/validation";
import { CostSummary } from "./cost-summary";
import { OrderSummary, type OrderSummaryLine } from "./order-summary";
import { PaymentForm } from "./payment-form";
import { ShippingAddressForm } from "./shipping-address-form";
import { ShippingMethodSelector } from "./shipping-method-selector";

const EMPTY_ADDRESS: ShippingAddressInput = {
  fullName: "",
  street: "",
  city: "",
  postalCode: "",
  province: "",
  country: "España",
  phone: "",
};

const EMPTY_CARD: CardInput = {
  cardholderName: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
};

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

  const [card, setCard] = useState<CardInput>(EMPTY_CARD);
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const cancelPaymentRef = useRef(false);

  const subtotal = totalAmount;
  const shippingCost = getShippingCost(shippingMethod, subtotal);
  const { tax, total } = calculateCostSummary(subtotal, shippingCost);

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
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 py-20 text-center dark:border-neutral-700">
        <ShoppingBagIcon className="h-8 w-8 text-neutral-400" />
        <p className="text-sm text-neutral-500">Tu carrito está vacío.</p>
        <Link
          href="/"
          className="mt-2 rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 dark:bg-white dark:text-black"
        >
          Ir a comprar
        </Link>
      </div>
    );
  }

  const handleConfirm = async () => {
    const addressErrors = validateShippingAddress(shippingAddress);
    const cardValidationErrors = validateCard(card);
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

    cancelPaymentRef.current = false;
    setIsProcessing(true);

    try {
      const intent = await paymentsRepository.createIntent(total, "EUR");
      const confirmed = await paymentsRepository.confirmPayment(
        intent,
        card,
        user?.email,
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
      }));

      const order = await ordersRepository.create({
        userId: user?.id ?? GUEST_USER_ID,
        items,
        shippingAddress,
        shippingMethod,
        subtotal,
        shippingCost,
        tax,
        total,
        payment: {
          provider: confirmed.provider,
          transactionId: confirmed.id,
          last4: card.cardNumber.replace(/\s/g, "").slice(-4),
        },
      });
      await paymentsRepository.linkToOrder(confirmed.id, order.id);

      if (user && saveAddress) {
        await addressesRepository.create(user.id, {
          ...shippingAddress,
          label: "Envío",
          isDefault: false,
        });
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
          />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">3. Método de envío</h2>
          <ShippingMethodSelector
            subtotal={subtotal}
            selected={shippingMethod}
            onChange={setShippingMethod}
          />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">4. Pago</h2>
          <PaymentForm
            value={card}
            errors={cardErrors}
            onChange={setCard}
            disabled={isProcessing}
          />
        </section>
      </div>

      <aside className="h-fit rounded-xl border border-neutral-200 p-5 lg:sticky lg:top-24 dark:border-neutral-800">
        <h2 className="mb-4 text-lg font-semibold">Resumen de costos</h2>
        <CostSummary
          subtotal={subtotal}
          shippingCost={shippingCost}
          tax={tax}
          total={total}
        />
        {paymentError ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {paymentError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isProcessing}
          className="mt-6 flex w-full items-center justify-center rounded-full bg-black p-4 text-sm font-medium tracking-wide text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isProcessing ? "Procesando pago..." : "Pagar y confirmar pedido"}
        </button>
        {isProcessing ? (
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
