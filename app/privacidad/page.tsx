import type { Metadata } from "next";
import Link from "next/link";
import Footer from "components/layout/footer";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Cómo Radaelli Swimwear recopila, usa y protege tus datos personales al comprar en la tienda.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Política de privacidad
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
              Qué datos recopilamos y para qué
            </h2>
            <p>
              Para procesar tu pedido recopilamos los datos necesarios para
              gestionarlo: nombre, dirección de entrega, teléfono y correo
              electrónico. Si creás una cuenta en la tienda, también
              guardamos los datos de esa cuenta y tu sesión. Sobre el pago,
              consultá nuestros{" "}
              <Link href="/terminos" className="underline hover:text-brand-crimson">
                Términos y condiciones
              </Link>
              , donde ya explicamos cómo lo procesamos.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Cookies
            </h2>
            <p>
              Usamos cookies para que la tienda funcione correctamente. El
              detalle completo — qué tipos usamos y para qué — está en
              nuestra{" "}
              <Link href="/cookies" className="underline hover:text-brand-crimson">
                Política de cookies
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Con quién compartimos datos
            </h2>
            <p>
              Compartimos datos únicamente con los proveedores que
              necesitamos para operar la tienda: Wompi, para procesar los
              pagos; Resend, para enviarte los correos transaccionales de tu
              pedido; y Cloudinary, que aloja únicamente las imágenes de
              producto y no recibe datos personales tuyos. No vendemos ni
              compartimos tus datos con terceros para fines publicitarios.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Cuánto tiempo conservamos los datos
            </h2>
            <p>
              Conservamos los datos de tus pedidos mientras sea necesario
              para cumplir con nuestras obligaciones legales, contables y de
              garantía.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Tus derechos
            </h2>
            <p>
              De acuerdo con la normativa colombiana de protección de datos
              (Habeas Data), podés acceder, corregir o solicitar la
              eliminación de tus datos personales en cualquier momento.
              Para ejercer estos derechos, escribinos por los canales de
              contacto de la tienda.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Actualizaciones
            </h2>
            <p>
              Radaelli Swimwear se reserva el derecho de actualizar esta
              política; los cambios aplican a pedidos y visitas realizados
              después de su publicación.
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
