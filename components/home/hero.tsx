import { PlaceholderArt } from "./placeholder-art";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[92vh] scroll-mt-20 items-end overflow-hidden bg-neutral-950 text-white"
    >
      <PlaceholderArt tone="ink" className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-40 lg:px-8">
        <p className="mb-4 animate-fade-in text-xs uppercase tracking-[0.4em] text-white/70">
          Nueva colección — Otoño / Invierno
        </p>
        <h1 className="max-w-3xl animate-fade-in-up font-semibold text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          El lujo se viste de esencial
        </h1>
        <p className="mt-6 max-w-xl animate-fade-in-up text-base text-white/80 [animation-delay:120ms] sm:text-lg">
          Piezas atemporales, materiales nobles y una sastrería pensada para
          durar. Descubre la nueva temporada.
        </p>
        <div className="mt-10 flex animate-fade-in-up flex-wrap gap-4 [animation-delay:240ms]">
          <a
            href="#productos"
            className="rounded-full bg-white px-8 py-3.5 text-sm font-medium tracking-wide text-black transition-transform duration-300 hover:scale-[1.03]"
          >
            Comprar ahora
          </a>
          <a
            href="#categorias"
            className="rounded-full border border-white/40 px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-colors duration-300 hover:bg-white/10"
          >
            Ver categorías
          </a>
        </div>
      </div>
    </section>
  );
}
