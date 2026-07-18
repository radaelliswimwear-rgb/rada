import { formatPrice } from "lib/format";
import { FREE_SHIPPING_THRESHOLD } from "lib/checkout/shipping-methods";
import { BrandPattern } from "./brand-pattern";

// Fondo en degradado con los tonos tierra de la guía de marca (espresso ->
// chocolate) en vez del negro genérico anterior — mismo criterio de
// paleta que Hero (Sprint 18).
export function PromoBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-espresso to-brand-chocolate py-16 text-white">
      <BrandPattern className="absolute inset-0 h-full w-full text-brand-amber/[0.15]" />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center lg:px-8">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-amber">
          Por tiempo limitado
        </p>
        <h2 className="font-semibold tracking-tight text-3xl sm:text-4xl">
          Envío gratuito en pedidos superiores a {formatPrice(FREE_SHIPPING_THRESHOLD)}
        </h2>
        <a
          href="#productos"
          className="mt-4 rounded-full bg-gradient-to-r from-brand-coral to-brand-crimson px-8 py-3 text-sm font-medium tracking-wide text-white transition-transform duration-300 hover:scale-[1.03]"
        >
          Descubrir la colección
        </a>
      </div>
    </section>
  );
}
