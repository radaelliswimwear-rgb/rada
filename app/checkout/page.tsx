import { CheckoutContent } from "components/checkout/checkout-content";
import Footer from "components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">
          Finalizar compra
        </h1>
        <CheckoutContent />
      </div>
      <Footer />
    </>
  );
}
