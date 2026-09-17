import type { Metadata } from "next";
import Link from "next/link";
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
              Coordinación del envío en compras inferiores a {threshold}
            </h2>
            <p>
              El costo del transporte no queda incluido en el pago del
              pedido: nuestro equipo te contacta después de confirmada la
              compra para informarte la tarifa según tu ciudad y acordar
              cómo la pagas — cuando corresponda, ese pago puede hacerse
              directamente a la transportadora al momento de la entrega o
              despacho.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Preparación y tiempos de entrega
            </h2>
            <p>
              Los tiempos de entrega indicados arriba corresponden al
              trayecto de la transportadora una vez el pedido queda
              despachado; son estimados y pueden variar por condiciones
              climáticas, temporada alta o factores ajenos a Radaelli
              Swimwear.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Dirección de entrega
            </h2>
            <p>
              Es responsabilidad de la clienta suministrar una dirección
              completa y correcta (calle, barrio, ciudad, referencias de
              acceso) al momento de la compra. Una dirección incompleta o
              errada puede retrasar la entrega o, si la transportadora
              devuelve el paquete, generar un costo de reenvío — ver más
              abajo.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Seguimiento del pedido
            </h2>
            <p>
              Cuando la transportadora genera número de guía, te lo
              compartimos para que puedas hacerle seguimiento directamente
              con ella.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Novedades de transporte
            </h2>
            <p>
              Si surge una novedad con la transportadora (demora, intento de
              entrega fallido, extravío), te acompañamos en la gestión ante
              ella hasta resolverlo.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Reenvíos
            </h2>
            <p>
              Si un paquete es devuelto por una dirección errada o
              incompleta suministrada por la clienta, o por no poder
              entregarse por causas atribuibles a ella, te informamos el
              costo del reenvío antes de despacharlo nuevamente.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Garantías y derecho de retracto
            </h2>
            <p>
              Esta política de envíos no reemplaza ni limita tus derechos
              como consumidora. Para defectos de fábrica, cambios y
              devoluciones, consulta nuestra{" "}
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
              Condiciones generales
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                El beneficio de envío gratuito aplica automáticamente cuando
                el subtotal de tu pedido (ya con el cupón aplicado, si usaste
                uno) alcanza {threshold}.
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
