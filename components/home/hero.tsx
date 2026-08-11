import { BrandPattern } from "./brand-pattern";
import { HeroBackground } from "./hero-background";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[62vh] scroll-mt-20 items-center overflow-hidden bg-white text-neutral-900"
    >
      <HeroBackground />
      <BrandPattern className="absolute inset-0 h-full w-full text-brand-muted/[0.12]" />
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 lg:px-8">
        <p className="mb-4 animate-fade-in text-xs uppercase tracking-[0.4em] text-brand-crimson">
          Radaelli Swimwear
        </p>
        <h1 className="max-w-3xl animate-fade-in-up font-semibold text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          Diseños que acompañan tu belleza natural con fuerza, libertad y
          estilo.
        </h1>
        <p className="mt-6 max-w-xl animate-fade-in-up text-base text-neutral-600 [animation-delay:120ms] sm:text-lg">
          Swimwear pensado para mujeres auténticas, seguras y poderosas.
        </p>
        <div className="mt-10 flex animate-fade-in-up flex-wrap gap-4 [animation-delay:240ms]">
          <a
            href="#productos"
            className="rounded-full bg-brand-coral px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-white shadow-lg shadow-brand-coral/20 transition-colors duration-300 hover:bg-brand-crimson"
          >
            Compra de forma sostenible
          </a>
        </div>
      </div>
    </section>
  );
}
