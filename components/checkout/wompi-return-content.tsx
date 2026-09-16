"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "components/auth/auth-store";
import { useLocalCart } from "components/cart-drawer/cart-store";
import { addressesRepository } from "lib/addresses/addresses-repository";
import {
  clearHostedCheckoutSession,
  readHostedCheckoutHandoff,
} from "lib/checkout/hosted-checkout-session";
import type { PendingOrderInput } from "lib/checkout/pending-order";
import { newsletterRepository } from "lib/newsletter/newsletter-repository";
import { ordersRepository } from "lib/orders/orders-repository";
import type { Order } from "lib/orders/types";
import { paymentsRepository } from "lib/payments/payments-repository";

// Misma función de siempre y mismo contrato que el checkout viejo
// (createOrderAction): items + dirección + método + pago. `transactionId` es
// la referencia del pago (Payment.providerRef) — el servidor busca esa fila,
// verifica que esté SUCCEEDED y arma el pedido a partir de ella, nunca de lo
// que mande este navegador. last4 va vacío a propósito: con el checkout
// alojado esta tienda no ve la tarjeta; los últimos 4 dígitos, si el medio
// de pago fue tarjeta, ya quedaron guardados en la fila Payment al
// verificar la transacción contra Wompi.
function createOrderFor(
  reference: string,
  pendingOrder: PendingOrderInput,
): Promise<Order> {
  return ordersRepository.create({
    items: pendingOrder.items,
    shippingAddress: pendingOrder.shippingAddress,
    shippingMethod: pendingOrder.shippingMethod,
    payment: { provider: "wompi", transactionId: reference, last4: "" },
  });
}

// Regreso desde el Checkout Web alojado de Wompi
// (propuesta/checkout-wompi-alojado). Wompi devuelve el navegador acá con
// SOLO "?id=<transaction_id>": ni el estado, ni el monto, ni una firma.
//
// Ese id NO prueba nada — cualquiera puede escribirlo a mano en la barra de
// direcciones. La documentación de Wompi lo dice explícitamente: la
// redirección es informativa, la confirmación real son los eventos. Por eso
// esta página no decide nada: le pasa el id a
// confirmHostedCheckoutReturnAction, que consulta el estado REAL contra la
// API de Wompi con la llave privada y lo aplica reusando la misma función
// auditada del webhook. Lo único que se muestra acá es lo que el servidor
// devolvió después de esa verificación.
const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 15; // ~60 segundos

type State =
  | { kind: "verifying" }
  | { kind: "pending"; attempts: number }
  | { kind: "pending-timeout"; reference: string }
  | { kind: "creating-order" }
  | { kind: "failed"; reference: string; reason: string | null; cancelled: boolean }
  | { kind: "error"; message: string }
  | { kind: "missing-id" }
  | { kind: "approved-without-data"; reference: string };

export function WompiReturnContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { clearCart } = useLocalCart();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("id");

  const [state, setState] = useState<State>({ kind: "verifying" });
  // React ejecuta los efectos dos veces en desarrollo (StrictMode): sin este
  // guard, el regreso dispararía dos verificaciones y dos intentos de crear
  // el pedido.
  const startedRef = useRef(false);
  const pollsRef = useRef(0);

  const finishWithOrder = useCallback(
    async (orderId: string) => {
      await clearCart().catch(() => undefined);
      clearHostedCheckoutSession();
      router.replace(`/checkout/confirmacion/${orderId}`);
    },
    [clearCart, router],
  );

  const createOrderFromHandoff = useCallback(
    async (reference: string) => {
      const handoff = readHostedCheckoutHandoff();
      // Sin los datos de esta pestaña no se puede armar el pedido acá (la
      // clienta volvió en otro navegador, o cerró la pestaña original). El
      // pago está aprobado igual: no se inventa nada, se le muestra la
      // referencia real para que pueda reclamarlo.
      if (!handoff || handoff.reference !== reference) {
        setState({ kind: "approved-without-data", reference });
        return;
      }

      setState({ kind: "creating-order" });
      const { pendingOrder } = handoff;
      try {
        const order = await createOrderFor(reference, pendingOrder);
        if (user && pendingOrder.saveAddress) {
          await addressesRepository
            .create({
              ...pendingOrder.shippingAddress,
              label: "Envío",
              isDefault: false,
            })
            .catch(() => undefined);
        }
        if (pendingOrder.subscribeNewsletter) {
          await newsletterRepository
            .subscribe(pendingOrder.shippingAddress.email)
            .catch(() => undefined);
        }
        await finishWithOrder(order.id);
      } catch {
        // El pago está cobrado y verificado; lo que falló es el registro del
        // pedido. Se dice exactamente eso, sin prometer un reintento
        // automático que no existe.
        setState({ kind: "approved-without-data", reference });
      }
    },
    [finishWithOrder, user],
  );

  const check = useCallback(async () => {
    if (!transactionId) {
      setState({ kind: "missing-id" });
      return;
    }

    const result =
      await paymentsRepository.confirmHostedCheckoutReturn(transactionId);
    if (!result.success) {
      setState({ kind: "error", message: result.error });
      return;
    }

    // El pago ya tiene pedido (la clienta recargó esta página, o el pedido se
    // creó por otra vía): nunca se crea un segundo pedido.
    if (result.orderId) {
      await finishWithOrder(result.orderId);
      return;
    }

    if (result.status === "succeeded") {
      await createOrderFromHandoff(result.reference);
      return;
    }

    if (result.status === "pending") {
      pollsRef.current += 1;
      if (pollsRef.current >= MAX_POLLS) {
        setState({ kind: "pending-timeout", reference: result.reference });
        return;
      }
      setState({ kind: "pending", attempts: pollsRef.current });
      setTimeout(() => {
        void check();
      }, POLL_INTERVAL_MS);
      return;
    }

    setState({
      kind: "failed",
      reference: result.reference,
      reason: result.failureReason,
      cancelled: result.status === "cancelled",
    });
  }, [createOrderFromHandoff, finishWithOrder, transactionId]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void check();
  }, [check]);

  if (state.kind === "missing-id") {
    return (
      <Panel title="No pudimos identificar tu pago">
        <p>
          Este enlace no trae la referencia de la transacción. Si ya pagaste,
          escribinos y lo verificamos con tu comprobante de Wompi.
        </p>
        <BackToCheckout />
      </Panel>
    );
  }

  if (state.kind === "verifying" || state.kind === "creating-order") {
    return (
      <Panel
        title={
          state.kind === "verifying"
            ? "Confirmando tu pago con Wompi..."
            : "Registrando tu pedido..."
        }
      >
        <p>No cierres esta pestaña.</p>
      </Panel>
    );
  }

  if (state.kind === "pending") {
    return (
      <Panel title="Wompi todavía está procesando tu pago">
        <p>
          Estamos consultando el estado con Wompi. No cierres esta pestaña.
        </p>
        <p className="text-xs text-neutral-500">
          Consulta {state.attempts} de {MAX_POLLS}.
        </p>
      </Panel>
    );
  }

  if (state.kind === "pending-timeout") {
    return (
      <Panel title="Tu pago sigue en proceso">
        <p>
          Wompi todavía no resolvió esta transacción. Tu referencia es{" "}
          <strong className="font-mono">{state.reference}</strong>: guardala.
        </p>
        <p>
          Podés volver a consultar recargando esta página. Si el pago termina
          rechazado, no se te cobra nada.
        </p>
        <BackToCheckout />
      </Panel>
    );
  }

  if (state.kind === "failed") {
    return (
      <Panel
        title={
          state.cancelled ? "El pago fue anulado" : "El pago no se completó"
        }
      >
        <p>
          {state.reason ??
            "Wompi no aprobó esta transacción. No se te cobró nada."}
        </p>
        <p className="text-xs text-neutral-500">
          Referencia: <span className="font-mono">{state.reference}</span>
        </p>
        <BackToCheckout label="Volver a intentar" />
      </Panel>
    );
  }

  if (state.kind === "approved-without-data") {
    return (
      <Panel title="Tu pago fue aprobado">
        <p>
          Wompi confirmó el cobro, pero no pudimos terminar de registrar el
          pedido en esta pestaña (por ejemplo, si volviste desde otro
          navegador).
        </p>
        <p>
          Guardá esta referencia y escribinos para que lo confirmemos a mano:{" "}
          <strong className="font-mono">{state.reference}</strong>
        </p>
      </Panel>
    );
  }

  return (
    <Panel title="No pudimos confirmar tu pago">
      <p>{state.message}</p>
      <p>
        Si ya pagaste, no vuelvas a intentarlo: recargá esta página en unos
        segundos o escribinos con tu comprobante de Wompi.
      </p>
      <BackToCheckout />
    </Panel>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 rounded-xl border border-neutral-200 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
      <h1 className="text-lg font-semibold text-black dark:text-white">
        {title}
      </h1>
      {children}
    </div>
  );
}

function BackToCheckout({ label = "Volver al checkout" }: { label?: string }) {
  return (
    <Link
      href="/checkout"
      className="mt-2 w-fit rounded-full bg-brand-coral px-5 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-crimson"
    >
      {label}
    </Link>
  );
}
