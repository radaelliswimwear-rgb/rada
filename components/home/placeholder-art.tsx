import clsx from "clsx";
import type { Tone } from "lib/placeholder-data";

const TONES: Record<Tone, string> = {
  sand: "from-[#d8cab8] via-[#c9b8a3] to-[#a8907a]",
  stone: "from-[#c9c7c2] via-[#a8a49d] to-[#7d7871]",
  ink: "from-[#3a3a3c] via-[#232325] to-[#0a0a0b]",
  clay: "from-[#c98d73] via-[#b06f56] to-[#7a4a38]",
  moss: "from-[#a9ad93] via-[#7f8468] to-[#565b45]",
  fog: "from-[#d6d9dc] via-[#b9bec3] to-[#8f959b]",
  rust: "from-[#b5674a] via-[#8f4a35] to-[#5e2f22]",
  linen: "from-[#e9e2d3] via-[#d8cdb6] to-[#b8a988]",
};

// Bloque de arte abstracto reutilizable que sustituye a la fotografía de producto
// mientras el catálogo real de Shopify no está conectado.
export function PlaceholderArt({
  tone = "stone",
  monogram,
  className,
}: {
  tone?: Tone;
  monogram?: string;
  className?: string;
}) {
  return (
    <div className={clsx("relative overflow-hidden bg-gradient-to-br", TONES[tone], className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.28),transparent_55%)]" />
      <div className="absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(45deg,#000_0,#000_1px,transparent_1px,transparent_7px)]" />
      {monogram ? (
        <span className="pointer-events-none absolute bottom-3 right-4 select-none font-bold text-6xl text-white/20">
          {monogram}
        </span>
      ) : null}
    </div>
  );
}
