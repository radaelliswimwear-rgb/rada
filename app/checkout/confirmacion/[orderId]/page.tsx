import { OrderConfirmation } from "components/checkout/order-confirmation";
import Footer from "components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false, follow: false },
};

export default async function CheckoutConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <OrderConfirmation orderId={orderId} />
      </div>
      <Footer />
    </>
  );
}
