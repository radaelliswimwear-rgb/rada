import type { Metadata } from "next";
import Link from "next/link";
import Footer from "components/layout/footer";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Condiciones generales de compra en Radaelli Swimwear: identificación de la tienda, proceso de pago, y enlaces a nuestras políticas de envíos, devoluciones y garantía.",
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Términos y condiciones
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
              Quiénes somos
            </h2>
            <p>
              Radaelli Swimwear es una tienda de trajes de baño de diseño
              atemporal. Al realizar una compra en este sitio aceptas estos
              términos y condiciones junto con nuestra{" "}
              <Link href="/envios" className="underline hover:text-brand-crimson">
                Política de envíos
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Productos y precios
            </h2>
            <p>
              Los precios se muestran en pesos colombianos (COP) e incluyen
              los descuentos vigentes al momento de la compra. Nos
              reservamos el derecho de corregir un precio publicado por
              error antes de confirmar el pago.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Pago
            </h2>
            <p>
              Los pagos con tarjeta, PSE, Nequi o Bancolombia se procesan a
              través de la pasarela segura de Wompi: los datos de tu tarjeta
              se ingresan directamente en su página, nunca pasan por ni
              quedan guardados en esta tienda. También podés coordinar tu
              compra directamente por WhatsApp.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Envíos, cambios y garantía
            </h2>
            <p>
              El costo y las condiciones de envío se rigen por nuestra{" "}
              <Link href="/envios" className="underline hover:text-brand-crimson">
                Política de envíos
              </Link>
              . Para cambios, devoluciones y defectos de fábrica, consultá
              nuestra{" "}
              <Link href="/devoluciones" className="underline hover:text-brand-crimson">
                Política de devoluciones
              </Link>{" "}
              y nuestra{" "}
              <Link href="/garantia" className="underline hover:text-brand-crimson">
                Política de garantía
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Actualizaciones
            </h2>
            <p>
              Radaelli Swimwear se reserva el derecho de actualizar estos
              términos; los cambios aplican a pedidos realizados después de
              su publicación.
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
