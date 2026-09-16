import { Suspense } from "react";
import Footer from "components/layout/footer";
import { WompiReturnContent } from "components/checkout/wompi-return-content";
import type { Metadata } from "next";

// redirect-url del Checkout Web alojado de Wompi
// (propuesta/checkout-wompi-alojado): acá vuelve el navegador después de
// pagar, con "?id=<transaction_id>" y nada más. noindex por lo mismo que
// /checkout y /checkout/confirmacion: es una página de un pedido concreto,
// no contenido de catálogo.
export const metadata: Metadata = {
  title: "Confirmando tu pago",
  robots: { index: false, follow: false },
};

export default function WompiReturnPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        {/* useSearchParams necesita un límite de Suspense para que Next pueda
            renderizar el resto de la página sin esperar al cliente. */}
        <Suspense
          fallback={
            <div className="mx-auto max-w-xl rounded-xl border border-neutral-200 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
              Confirmando tu pago con Wompi...
            </div>
          }
        >
          <WompiReturnContent />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
