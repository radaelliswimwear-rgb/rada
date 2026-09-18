import Link from "next/link";
import Footer from "components/layout/footer";
import type { Metadata } from "next";

// SEO técnico (auditoría de septiembre 2026): antes no existía este
// archivo -- una URL inexistente caía en el 404 genérico de Next.js, sin
// marca ni navegación útil. Next.js sigue devolviendo el status HTTP 404
// real para cualquier ruta que no matchee ningún segmento (o que llame
// notFound(), ej. app/producto/[slug]/page.tsx, app/blog/[slug]/page.tsx),
// esto solo reemplaza el contenido visible. robots noindex explícito para
// que una URL rota nunca quede indexada por error.
export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center lg:px-8">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Error 404
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          No encontramos esta página
        </h1>
        <p className="max-w-md text-sm text-neutral-500">
          El link puede estar roto o la página ya no existe. Volvé al inicio
          o explorá nuestra colección.
        </p>
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-full bg-brand-coral px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-crimson"
          >
            Ir al inicio
          </Link>
          <Link
            href="/buscar"
            className="rounded-full border border-neutral-300 px-6 py-2.5 text-sm text-black transition-colors duration-200 hover:border-brand-crimson hover:text-brand-crimson dark:border-neutral-700 dark:text-white"
          >
            Buscar productos
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
