// Textura de fondo de marca (Sprint 18): versión propia, a color, del
// tejido de ganchos entrelazados de la identidad visual de LAGO — mismo
// tramado diagonal en zigzag que el original, pero con trazo más fino y
// coloreable vía `currentColor` para poder tintarlo con la paleta de marca
// en cada sección (Hero, banner) en vez de quedar fijo en blanco y negro.
export function BrandPattern({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="lago-brand-weave"
          width="56"
          height="56"
          patternUnits="userSpaceOnUse"
          patternTransform="scale(1)"
        >
          <path
            d="M0 14 L14 0 L28 14 L14 28 Z M28 14 L42 0 L56 14 L42 28 Z M0 42 L14 28 L28 42 L14 56 Z M28 42 L42 28 L56 42 L42 56 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lago-brand-weave)" />
    </svg>
  );
}
