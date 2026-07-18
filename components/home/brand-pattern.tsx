// Textura de fondo de marca (Sprint 18): el isotipo real de LAGO (los dos
// ganchos entrelazados del logo) repetido como estampado de fondo, no una
// grilla ni un tejido inventado — mismo color/opacidad que ya tenía el
// panel (se fija desde afuera vía `className`, ver Hero/PromoBanner).
export function BrandPattern({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="lago-brand-logo"
          width="180"
          height="90"
          patternUnits="userSpaceOnUse"
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Gancho izquierdo del isotipo. */}
            <path d="M25 65 L55 25 L85 65" />
            {/* Gancho derecho, entrelazado con el izquierdo en el cruce
                central (misma silueta de dos "V" superpuestas del logo). */}
            <path d="M75 65 L105 25 L135 65" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lago-brand-logo)" />
    </svg>
  );
}
