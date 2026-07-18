import { BrandPattern } from "./brand-pattern";
import { HeroBackground } from "./hero-background";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[62vh] scroll-mt-20 items-center overflow-hidden bg-brand-bg text-white"
    >
      <HeroBackground />
      <BrandPattern className="absolute inset-0 h-full w-full text-brand-accent/[0.14]" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/40 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 lg:px-8">
        <p className="mb-4 animate-fade-in text-xs uppercase tracking-[0.4em] text-brand-hover">
          Nueva colección — Otoño / Invierno
        </p>
        <h1 className="max-w-3xl animate-fade-in-up font-semibold text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          El lujo se viste de esencial
        </h1>
        <p className="mt-6 max-w-xl animate-fade-in-up text-base text-white/70 [animation-delay:120ms] sm:text-lg">
          Piezas atemporales, materiales nobles y una sastrería pensada para
          durar. Descubre la nueva temporada.
        </p>
        <div className="mt-10 flex animate-fade-in-up flex-wrap gap-4 [animation-delay:240ms]">
          <a
            href="#productos"
            className="rounded-full bg-brand-accent px-8 py-3.5 text-sm font-medium tracking-wide text-white shadow-lg shadow-black/20 transition-colors duration-300 hover:bg-brand-hover"
          >
            Comprar ahora
          </a>
          <a
            href="#categorias"
            className="rounded-full border border-brand-muted px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-colors duration-300 hover:bg-brand-surface"
          >
            Ver categorías
          </a>
        </div>
      </div>
    </section>
  );
}
