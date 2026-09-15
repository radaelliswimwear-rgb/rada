import { Money } from "components/currency/money";
import { formatPrice } from "lib/format";

// Sprint 28: sin IVA (no se está cobrando) y sin tarifario de envío por
// ciudad — nunca se inventa un costo de envío. Arriba de
// freeShippingThreshold queda "Gratis"; por debajo, "Por confirmar" (se
// informa antes del despacho). Mientras el envío esté sin confirmar, la
// fila de abajo dice "Total productos" en vez de "Total" — para que nunca
// parezca que ese monto ya incluye todo lo que se va a cobrar.
export function CostSummary({
  subtotal,
  discount = 0,
  total,
  freeShippingThreshold,
  qualifiesForFreeShipping,
}: {
  subtotal: number;
  discount?: number;
  total: number;
  freeShippingThreshold: number;
  qualifiesForFreeShipping: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">Subtotal</span>
        <Money amountCop={subtotal} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">Envío</span>
        <span
          className={
            qualifiesForFreeShipping
              ? "font-medium text-green-700 dark:text-green-400"
              : "text-neutral-600 dark:text-neutral-400"
          }
        >
          {qualifiesForFreeShipping ? "Gratis" : "Por confirmar"}
        </span>
      </div>
      {discount > 0 ? (
        <div className="flex items-center justify-between text-green-700 dark:text-green-400">
          <span>Descuento</span>
          <span>-<Money amountCop={discount} /></span>
        </div>
      ) : null}
      <div className="mt-2 flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-semibold dark:border-neutral-800">
        <span>{qualifiesForFreeShipping ? "Total" : "Total productos"}</span>
        <Money amountCop={total} />
      </div>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">
        El valor del envío se informa antes del despacho, según el destino.
        En compras desde {formatPrice(freeShippingThreshold)}, el envío es
        gratis.
      </p>
    </div>
  );
}
