// Textura de fondo de marca (Sprint 18): tejido diagonal de ganchos en
// escalón (con una pequeña muesca en cada brazo, no un zigzag liso) que
// se entrelazan formando una trama continua sin huecos — mismo criterio
// de módulo desfasado que el resto de la textura, ajustado para calzar
// con la referencia provista por la clienta (patrón rasterizado, sin
// vector disponible: esto es una reconstrucción manual del dibujo, no
// una copia exacta pixel a pixel).
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
          width="40"
          height="80"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="miter"
          >
            {/* Fila 1: gancho con muesca (escalón corto a mitad del
                trazo), en la mitad superior del módulo. */}
            <path d="M2 34 L16 20 L20 20 L34 6" />
            {/* Fila 2: el mismo gancho, desfasado medio módulo y cortado
                en el borde del tile — el módulo vecino trae la otra
                mitad, así el tejido no muestra corte. */}
            <path d="M22 74 L36 60 L40 60" />
            <path d="M0 60 L14 46" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lago-brand-weave)" />
    </svg>
  );
}
