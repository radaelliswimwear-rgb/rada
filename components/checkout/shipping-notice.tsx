import Link from "next/link";
import { formatPrice } from "lib/format";

// Aviso visible ANTES de pagar (Sprint 32) -- separado del footnote chico de
// CostSummary a propósito: la clienta tiene que verlo sin tener que leer
// letra pequeña. Nunca dice "gratis" cuando el pedido no califica.
export function ShippingNotice({
  qualifiesForFreeShipping,
  freeShippingThreshold,
}: {
  qualifiesForFreeShipping: boolean;
  freeShippingThreshold: number;
}) {
  if (qualifiesForFreeShipping) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
        <p className="font-medium">Envío estándar gratis</p>
        <p className="mt-0.5 text-xs text-green-700 dark:text-green-400">
          Tu pedido califica para envío estándar gratis dentro de Colombia.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <p className="font-medium">Envío por coordinar</p>
      <p className="mt-0.5 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
        El costo del envío no está incluido en este pago. Después de
        confirmar tu compra, nos comunicaremos contigo para cotizar y
        coordinar el envío según tu ubicación.
      </p>
      <p className="mt-1.5 text-xs text-amber-800 dark:text-amber-300">
        En compras desde {formatPrice(freeShippingThreshold)} el envío
        estándar es gratis.{" "}
        <Link href="/envios" className="underline underline-offset-2">
          Ver política de envíos
        </Link>
        .
      </p>
    </div>
  );
}
