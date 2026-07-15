import type { Metadata } from "next";
import { AdminShell } from "components/admin/admin-shell";
import { OrdersTable } from "components/admin/orders-table";
import Footer from "components/layout/footer";
import { adminOrdersRepository } from "lib/admin/orders-repository";

export const metadata: Metadata = {
  title: "Admin — Pedidos",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  const orders = await adminOrdersRepository.listAll();

  return (
    <>
      <AdminShell title="Pedidos">
        <OrdersTable initialOrders={orders} />
      </AdminShell>
      <Footer />
    </>
  );
}
