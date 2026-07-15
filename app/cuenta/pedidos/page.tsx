import { AccountShell } from "components/account/account-shell";
import { OrderHistory } from "components/account/order-history";
import Footer from "components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedidos",
  robots: { index: false, follow: false },
};

export default function PedidosPage() {
  return (
    <>
      <AccountShell title="Pedidos">
        <OrderHistory />
      </AccountShell>
      <Footer />
    </>
  );
}
