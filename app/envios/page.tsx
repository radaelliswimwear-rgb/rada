import type { Metadata } from "next";
import Footer from "components/layout/footer";
import { formatPrice } from "lib/format";
import { FREE_SHIPPING_THRESHOLD } from "lib/checkout/shipping-methods";

export const metadata: Metadata = {
  title: "Política de envíos",
  description:
    "Cobertura, tiempos y condiciones del envío gratuito a nivel nacional de Radaelli Swimwear.",
  alternates: { canonical: "/envios" },
};

const REMOTE_AREAS = [
  "Amazonas",
  "Chocó",
  "Vichada",
  "San Andrés y Providencia",
  "Guainía",
  "Vaupés",
  "Putumayo",
];

const FOCUS_CITIES = ["Medellín", "Barranquilla", "Cartagena", "Santa Marta"];

export default function EnviosPage() {
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
              Envío gratuito a nivel nacional
            </h2>
            <p>
              En compras superiores a {formatPrice(FREE_SHIPPING_THRESHOLD)} el
              envío es gratuito para la gran mayoría del territorio
              colombiano, incluyendo capitales y ciudades principales.
              Nuestro mayor volumen de despachos —y donde el beneficio aplica
              sin ninguna restricción— es hacia{" "}
              <strong>{FOCUS_CITIES.join(", ")}</strong> y el resto de
              ciudades principales del país.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Excepciones: municipios apartados
            </h2>
            <p>
              Por su mayor costo logístico, algunos municipios de difícil
              cobertura no están incluidos en el envío gratuito y tienen un
              cargo adicional que se calcula y muestra antes de confirmar el
              pago. Esto incluye, entre otros, destinos en:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {REMOTE_AREAS.map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>
            <p className="mt-3">
              Si tu municipio no aparece en esta lista, en la enorme mayoría
              de los casos el envío es gratuito. El costo exacto para tu
              dirección siempre se confirma en el checkout antes de pagar.
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
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Condiciones generales
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                El beneficio de envío gratuito aplica automáticamente cuando
                el subtotal del pedido supera {formatPrice(FREE_SHIPPING_THRESHOLD)}.
              </li>
              <li>
                Los tiempos de entrega son estimados y pueden variar por
                condiciones climáticas, temporada alta o factores ajenos a
                Radaelli Swimwear.
              </li>
              <li>
                Radaelli Swimwear se reserva el derecho de actualizar esta
                política y la lista de municipios con cargo adicional; los
                cambios aplican a pedidos realizados después de su
                publicación.
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
