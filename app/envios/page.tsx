import type { Metadata } from "next";
import Footer from "components/layout/footer";
import { settingsRepository } from "lib/currency/settings-repository";
import { formatPrice } from "lib/format";

export const metadata: Metadata = {
  title: "Política de envíos",
  description:
    "Envío gratuito a nivel nacional en compras desde cierto monto — para el resto, el valor se informa antes del despacho según el destino.",
  alternates: { canonical: "/envios" },
};

export default async function EnviosPage() {
  const settings = await settingsRepository.get();
  const threshold = formatPrice(settings.freeShippingThreshold);

  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Política de envíos
        </h1>
        <p className="mb-10 text-neutral-600">
          Última actualización: {new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-neutral-700 sm:text-base">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Envíos nacionales
            </h2>
            <p>
              En compras iguales o superiores a {threshold} COP, Radaelli
              Swimwear ofrece envío gratuito dentro de Colombia, sujeto a las
              condiciones y cobertura de nuestras transportadoras. Para
              compras inferiores a este valor, el costo del envío será
              asumido por el cliente y se informará antes del despacho, de
              acuerdo con el destino y la tarifa vigente de la
              transportadora.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Transportadora y tiempos de entrega
            </h2>
            <p>
              Trabajamos con <strong>Envia</strong> como transportadora
              principal a nivel nacional.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Envío estándar: 3 a 5 días hábiles.</li>
              <li>Envío express: 24 a 48 horas (disponible para ciudades principales).</li>
            </ul>
            <p className="mt-3">
              La cobertura y el tiempo exacto de entrega para tu dirección
              puede variar según la zona.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Condiciones generales
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                El beneficio de envío gratuito aplica automáticamente cuando
                el subtotal de tu pedido (ya con el cupón aplicado, si usaste
                uno) alcanza {threshold}.
              </li>
              <li>
                Los tiempos de entrega son estimados y pueden variar por
                condiciones climáticas, temporada alta o factores ajenos a
                Radaelli Swimwear.
              </li>
              <li>
                Radaelli Swimwear se reserva el derecho de actualizar esta
                política; los cambios aplican a pedidos realizados después
                de su publicación.
              </li>
            </ul>
          </section>

          <p className="text-neutral-500">
            ¿Tienes dudas sobre el envío a tu ciudad?{" "}
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
