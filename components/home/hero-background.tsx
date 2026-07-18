// Fondo dinámico del Hero: masas de luz difusas en los tonos de la
// identidad principal (acento, hover, superficie) que derivan muy
// lentamente sobre el fondo premium oscuro (CSS puro, sin "use client" —
// el Hero sigue pudiendo renderizarse como Server Component). Reemplaza
// al PlaceholderArt estático solo aquí; PlaceholderArt no se toca porque
// se reutiliza en catálogo/tarjetas de producto.
export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-brand-bg">
      <div className="animate-drift-1 absolute left-1/4 top-0 h-[60vh] w-[60vh] rounded-full bg-brand-accent/25 blur-3xl" />
      <div className="animate-drift-2 absolute right-0 top-1/3 h-[50vh] w-[50vh] rounded-full bg-brand-hover/20 blur-3xl" />
      <div className="animate-drift-3 absolute bottom-0 left-0 h-[55vh] w-[55vh] rounded-full bg-brand-surface/60 blur-3xl" />
    </div>
  );
}
