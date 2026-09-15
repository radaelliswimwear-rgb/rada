import { settingsRepository } from "lib/currency/settings-repository";
import { formatPrice } from "lib/format";
import { BrandPattern } from "./brand-pattern";

// Fondo pastel claro (blush -> blanco) para el look limpio pedido en el
// Home — el fondo oscuro de la identidad principal (brand-bg/surface)
// queda reservado para secciones fuera del Home (Sprint 18).
//
// Sprint 28: ya no se cobra IVA en el checkout, y el envío es gratis desde
// el monto configurado en /admin/configuracion (ver CostSummary) — por
// debajo de ese monto, el valor se informa antes del despacho según el
// destino, nunca "contra entrega" (ese término implica un método de pago,
// no cómo se cobra el envío). El gancho de este banner sigue siendo el
// descuento del sitio; la letra chica de abajo ahora anuncia el envío
// gratis con el monto real, no un número fijo hardcodeado.
export async function PromoBanner() {
  const settings = await settingsRepository.get();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-blush/30 to-white py-16 text-neutral-900">
      <BrandPattern className="absolute inset-0 h-full w-full text-brand-muted/[0.12]" />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center lg:px-8">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-crimson">
          Por tiempo limitado
        </p>
        <h2 className="font-semibold tracking-tight text-3xl sm:text-4xl">
          20% de descuento en toda la tienda
        </h2>
        <a
          href="#productos"
          className="mt-4 rounded-full bg-brand-coral px-8 py-3 text-sm font-medium tracking-wide text-white transition-colors duration-300 hover:bg-brand-crimson"
        >
          Descubrir la colección
        </a>
        <p className="mt-2 max-w-md text-[11px] leading-relaxed text-neutral-500">
          Envío gratis en compras desde{" "}
          {formatPrice(settings.freeShippingThreshold)}.{" "}
          <a href="/envios" className="underline hover:text-brand-crimson">
            Ver política de envíos
          </a>
          .
        </p>
      </div>
    </section>
  );
}
