// Textura de fondo de marca (Sprint 18): tejido de ganchos entrelazados
// tipo el isotipo de LAGO, en zigzag continuo (sin huecos entre motivos,
// a diferencia del primer intento) y en diagonal como en la guía de
// marca. El "gancho" de una fila queda desfasado medio módulo respecto a
// la fila siguiente para que las puntas encajen unas con otras — así se
// ve como un tejido continuo, no como íconos sueltos en grilla.
export function BrandPattern({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="lago-brand-hooks"
          width="24"
          height="48"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Fila 1: gancho completo, en la mitad superior del módulo. */}
            <path d="M2 14 L12 2 L22 14" />
            {/* Fila 2: el mismo gancho, desfasado medio módulo y cortado en
                el borde del tile — el tejido continúa sin corte visible
                porque el módulo vecino trae la otra mitad. */}
            <path d="M14 38 L24 26" />
            <path d="M0 26 L10 38" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lago-brand-hooks)" />
    </svg>
  );
}
