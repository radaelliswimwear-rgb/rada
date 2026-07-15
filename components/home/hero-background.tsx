// Fondo dinámico del Hero: masas de luz difusas en tonos monocromos que
// derivan muy lentamente (CSS puro, sin "use client" — el Hero sigue
// pudiendo renderizarse como Server Component). Reemplaza al PlaceholderArt
// estático solo aquí; PlaceholderArt no se toca porque se reutiliza en
// catálogo/tarjetas de producto.
export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-neutral-950">
      <div className="absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(45deg,#fff_0,#fff_1px,transparent_1px,transparent_7px)]" />
      <div className="animate-drift-1 absolute left-1/4 top-0 h-[60vh] w-[60vh] rounded-full bg-white/[0.10] blur-3xl" />
      <div className="animate-drift-2 absolute right-0 top-1/3 h-[50vh] w-[50vh] rounded-full bg-neutral-300/[0.08] blur-3xl" />
      <div className="animate-drift-3 absolute bottom-0 left-0 h-[55vh] w-[55vh] rounded-full bg-white/[0.07] blur-3xl" />
    </div>
  );
}
