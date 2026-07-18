import clsx from "clsx";
import type { Tone } from "lib/placeholder-data";

// Tonos alineados a la paleta de marca (Sprint 18) — antes eran grises y
// tierras genéricos sin relación con la identidad de LAGO.
const TONES: Record<Tone, string> = {
  sand: "from-[#fcbaf2] via-[#c69379] to-[#ad814e]",
  stone: "from-[#c69379] via-[#ad814e] to-[#785447]",
  ink: "from-[#442a16] via-[#28170b] to-[#1a0f07]",
  clay: "from-[#c69379] via-[#ad814e] to-[#785447]",
  moss: "from-[#785447] via-[#442a16] to-[#28170b]",
  fog: "from-[#fcbaf2] via-[#ad814e] to-[#785447]",
  rust: "from-[#ff6267] via-[#d00149] to-[#785447]",
  linen: "from-[#fcbaf2] via-[#c69379] to-[#ad814e]",
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
