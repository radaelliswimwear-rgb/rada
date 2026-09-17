import type { Metadata } from "next";
import Link from "next/link";
import { ChangeConsentPreferencesButton } from "components/consent/change-consent-preferences-button";
import Footer from "components/layout/footer";

export const metadata: Metadata = {
  title: "Política de cookies",
  description:
    "Qué cookies usa Radaelli Swimwear, para qué sirven y cómo podés gestionar tus preferencias.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Política de cookies
        </h1>
        <p className="mb-10 text-neutral-600">
          Última actualización:{" "}
          {new Date().toLocaleDateString("es-CO", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-neutral-700 sm:text-base">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Qué son las cookies
            </h2>
            <p>
              Las cookies son pequeños archivos que un sitio guarda en tu
              navegador para recordar información entre visitas o mientras
              navegás por él.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Cookies esenciales
            </h2>
            <p>
              Siempre activas — no requieren tu consentimiento, porque sin
              ellas la tienda no funciona. Las usamos para cosas como
              mantener tu carrito de compra, tu sesión si tenés una cuenta,
              la seguridad del proceso de pago y otras preferencias
              necesarias para que el sitio opere correctamente.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Cookies analíticas
            </h2>
            <p>
              Opcionales, requieren tu consentimiento. Hoy no las usamos. Si
              en el futuro activamos herramientas de análisis, estas
              cookies nos ayudarían a entender cómo se usa el sitio —por
              ejemplo, tráfico o páginas más visitadas— y solo se activarían
              con tu autorización.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Cookies de marketing y publicidad
            </h2>
            <p>
              Opcionales, requieren tu consentimiento. Hoy no las usamos. Si
              en el futuro activamos herramientas de medición de publicidad,
              estas cookies se usarían para ese fin y, al igual que las
              analíticas, solo se activarían con tu autorización.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Cómo cambiar tus preferencias
            </h2>
            <p className="mb-3">
              Podés cambiar tus preferencias de cookies analíticas y de
              marketing cuando quieras.
            </p>
            <ChangeConsentPreferencesButton />
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Más información
            </h2>
            <p>
              Para conocer qué otros datos recopilamos y cómo los usamos,
              consultá nuestra{" "}
              <Link href="/privacidad" className="underline hover:text-brand-crimson">
                Política de privacidad
              </Link>
              .
            </p>
          </section>

          <p className="text-neutral-500">
            ¿Tienes dudas?{" "}
            <a href="/#contacto" className="underline hover:text-brand-crimson">
              Contáctanos
            </a>
            .
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
