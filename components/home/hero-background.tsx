// Fondo dinámico del Hero: masas de luz difusas en tonos cálidos y
// vívidos (naranja, rosa, ámbar) que derivan muy lentamente sobre blanco
// (CSS puro, sin "use client" — el Hero sigue pudiendo renderizarse como
// Server Component). Reemplaza al PlaceholderArt estático solo aquí;
// PlaceholderArt no se toca porque se reutiliza en catálogo/tarjetas de
// producto.
export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-white">
      <div className="animate-drift-1 absolute left-1/4 top-0 h-[60vh] w-[60vh] rounded-full bg-brand-coral/30 blur-3xl" />
      <div className="animate-drift-2 absolute right-0 top-1/3 h-[50vh] w-[50vh] rounded-full bg-brand-indigo/20 blur-3xl" />
      <div className="animate-drift-3 absolute bottom-0 left-0 h-[55vh] w-[55vh] rounded-full bg-brand-amber/30 blur-3xl" />
    </div>
  );
}
