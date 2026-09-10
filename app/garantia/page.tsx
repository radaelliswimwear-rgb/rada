import type { Metadata } from "next";
import Link from "next/link";
import Footer from "components/layout/footer";

export const metadata: Metadata = {
  title: "Política de garantía",
  description:
    "Garantía de 12 meses por defectos de fabricación o calidad de Radaelli Swimwear.",
  alternates: { canonical: "/garantia" },
};

export default function GarantiaPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Política de garantía
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
              Cobertura
            </h2>
            <p>
              Todos los productos Radaelli Swimwear cuentan con{" "}
              <strong>garantía de 12 meses</strong> contados desde la fecha
              de entrega, por defectos de fabricación o de calidad (costuras,
              tela, herrajes, estampado).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Qué no cubre
            </h2>
            <p>
              La garantía no cubre daños que resulten comprobadamente de un
              mal uso de la prenda, del desgaste normal por el uso, o de no
              seguir las indicaciones de cuidado (lavado a mano con agua
              fría, sin blanqueador, sin retorcer, secado a la sombra y sin
              contacto con superficies ásperas).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Cómo hacer efectiva la garantía
            </h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Escríbenos por WhatsApp con tu número de pedido, la fecha de
                compra y fotos o video claros del defecto.
              </li>
              <li>Evaluamos el caso y te confirmamos si está cubierto.</li>
              <li>
                Si el defecto está cubierto, coordinamos la reparación, el
                cambio o el reembolso según corresponda. El costo de envío
                para hacer efectiva una garantía cubierta corre por cuenta de
                Radaelli Swimwear, no de la clienta.
              </li>
            </ol>
          </section>

          <p className="text-neutral-500">
            Esta garantía es distinta a nuestra{" "}
            <Link
              href="/devoluciones"
              className="underline hover:text-brand-crimson"
            >
              Política de devoluciones
            </Link>{" "}
            (para prenda equivocada o daño en el transporte). ¿Tienes un caso
            para reportar?{" "}
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
