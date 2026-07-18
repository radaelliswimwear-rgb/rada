import { HeroBackground } from "./hero-background";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[62vh] scroll-mt-20 items-center overflow-hidden bg-white text-neutral-900"
    >
      <HeroBackground />
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 lg:px-8">
        <p className="mb-4 animate-fade-in text-xs uppercase tracking-[0.4em] text-orange-600">
          Nueva colección — Otoño / Invierno
        </p>
        <h1 className="max-w-3xl animate-fade-in-up font-semibold text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          El lujo se viste de esencial
        </h1>
        <p className="mt-6 max-w-xl animate-fade-in-up text-base text-neutral-600 [animation-delay:120ms] sm:text-lg">
          Piezas atemporales, materiales nobles y una sastrería pensada para
          durar. Descubre la nueva temporada.
        </p>
        <div className="mt-10 flex animate-fade-in-up flex-wrap gap-4 [animation-delay:240ms]">
          <a
            href="#productos"
            className="rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-8 py-3.5 text-sm font-medium tracking-wide text-white shadow-lg shadow-orange-500/20 transition-transform duration-300 hover:scale-[1.03]"
          >
            Comprar ahora
          </a>
          <a
            href="#categorias"
            className="rounded-full border border-neutral-300 px-8 py-3.5 text-sm font-medium tracking-wide text-neutral-800 transition-colors duration-300 hover:bg-neutral-100"
          >
            Ver categorías
          </a>
        </div>
      </div>
    </section>
  );
}
