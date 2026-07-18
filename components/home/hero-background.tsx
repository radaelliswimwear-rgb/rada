// Fondo dinámico del Hero: masas de luz difusas en tonos pastel de la
// paleta viva (coral, rosa, mostaza) que derivan muy lentamente sobre
// blanco — look limpio pedido para el Home (CSS puro, sin "use client" —
// el Hero sigue pudiendo renderizarse como Server Component). Reemplaza
// al PlaceholderArt estático solo aquí; PlaceholderArt no se toca porque
// se reutiliza en catálogo/tarjetas de producto.
export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-white">
      <div className="animate-drift-1 absolute left-1/4 top-0 h-[60vh] w-[60vh] rounded-full bg-brand-coral/20 blur-3xl" />
      <div className="animate-drift-2 absolute right-0 top-1/3 h-[50vh] w-[50vh] rounded-full bg-brand-blush/40 blur-3xl" />
      <div className="animate-drift-3 absolute bottom-0 left-0 h-[55vh] w-[55vh] rounded-full bg-brand-amber/20 blur-3xl" />
    </div>
  );
}
