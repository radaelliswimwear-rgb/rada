import { formatPrice } from "lib/format";
import { FREE_SHIPPING_THRESHOLD } from "lib/checkout/shipping-methods";
import { BrandPattern } from "./brand-pattern";

// Fondo pastel claro (blush -> blanco) para el look limpio pedido en el
// Home — el fondo oscuro de la identidad principal (brand-bg/surface)
// queda reservado para secciones fuera del Home (Sprint 18).
export function PromoBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-blush/30 to-white py-16 text-neutral-900">
      <BrandPattern className="absolute inset-0 h-full w-full text-brand-muted/[0.12]" />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center lg:px-8">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-crimson">
          Por tiempo limitado
        </p>
        <h2 className="font-semibold tracking-tight text-3xl sm:text-4xl">
          Envío gratuito en pedidos superiores a {formatPrice(FREE_SHIPPING_THRESHOLD)}
        </h2>
        <a
          href="#productos"
          className="mt-4 rounded-full bg-brand-coral px-8 py-3 text-sm font-medium tracking-wide text-white transition-colors duration-300 hover:bg-brand-crimson"
        >
          Descubrir la colección
        </a>
      </div>
    </section>
  );
}
