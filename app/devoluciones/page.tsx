import type { Metadata } from "next";
import Link from "next/link";
import Footer from "components/layout/footer";

export const metadata: Metadata = {
  title: "Política de devoluciones",
  description:
    "Condiciones de devolución y cambio por defecto de fábrica de Radaelli Swimwear.",
  alternates: { canonical: "/devoluciones" },
};

export default function DevolucionesPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Política de devoluciones
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
              Cuándo aplica una devolución o cambio
            </h2>
            <p>
              Aceptamos devolución o cambio únicamente cuando el producto
              presenta:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Defecto de fábrica (costuras, tela, herrajes, estampado).</li>
              <li>
                Una prenda distinta a la que compraste (talla, color o
                referencia equivocada en el despacho).
              </li>
              <li>Daño ocasionado durante el transporte.</li>
            </ul>
            <p className="mt-3">
              Debes reportarlo dentro de los <strong>5 días hábiles</strong>{" "}
              siguientes a la fecha de entrega, escribiéndonos por WhatsApp o
              Instagram con fotos o video claros del defecto y el número de
              pedido. Evaluamos cada caso antes de aprobar la devolución.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Cuándo NO aplica
            </h2>
            <p>
              Por tratarse de prendas de baño e higiene íntima, no aceptamos
              devolución ni cambio cuando:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                El cliente simplemente cambió de opinión o ya no quiere el
                producto, sin que exista un defecto de fábrica.
              </li>
              <li>
                La prenda fue usada (mar, piscina, playa) o lavada, o no
                conserva sus etiquetas originales y el protector de higiene
                intacto.
              </li>
              <li>
                El daño es por mal uso, desgaste normal o cuidado inadecuado
                (no seguir las indicaciones de lavado).
              </li>
              <li>El reporte se hace fuera del plazo de 5 días hábiles.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Costo de envío de la devolución
            </h2>
            <p>
              Cuando el caso corresponde a un defecto de fábrica, una prenda
              distinta a la comprada o daño ocasionado durante el transporte,
              el costo de envío de la devolución corre por cuenta de
              Radaelli Swimwear, no de la clienta. Te lo confirmamos junto
              con las instrucciones de envío al aprobar el caso. Para más
              detalle sobre cobertura y procedimiento cuando se trata de un
              defecto de fábrica o de calidad, revisa también nuestra{" "}
              <Link href="/garantia" className="underline hover:text-brand-crimson">
                Política de garantía
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Proceso
            </h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Escríbenos por WhatsApp o Instagram con tu número de pedido y
                evidencia del defecto dentro de los 5 días hábiles siguientes
                a la entrega.
              </li>
              <li>Evaluamos el caso y te confirmamos si aplica.</li>
              <li>
                Si aplica, te damos las instrucciones para enviar el
                producto — ese envío corre por cuenta de Radaelli Swimwear.
              </li>
              <li>
                Al recibir y verificar el producto, coordinamos el cambio o
                el reembolso.
              </li>
            </ol>
          </section>

          <p className="text-neutral-500">
            ¿Tienes un caso para reportar?{" "}
            <a
              href="https://wa.me/573135359668"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-brand-crimson"
            >
              Escríbenos por WhatsApp
            </a>
            .
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
