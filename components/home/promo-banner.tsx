import { PlaceholderArt } from "./placeholder-art";

export function PromoBanner() {
  return (
    <section className="relative overflow-hidden bg-black py-16 text-white">
      <PlaceholderArt tone="rust" className="absolute inset-0 opacity-25" />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center lg:px-8">
        <p className="text-xs uppercase tracking-[0.35em] text-white/70">
          Por tiempo limitado
        </p>
        <h2 className="font-semibold tracking-tight text-3xl sm:text-4xl">
          Envío gratuito en pedidos superiores a 80€
        </h2>
        <a
          href="#productos"
          className="mt-4 rounded-full border border-white/50 px-8 py-3 text-sm tracking-wide transition-colors duration-300 hover:bg-white hover:text-black"
        >
          Descubrir la colección
        </a>
      </div>
    </section>
  );
}
