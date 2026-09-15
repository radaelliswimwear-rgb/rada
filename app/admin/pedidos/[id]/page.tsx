import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "components/admin/admin-shell";
import { OrderDetail } from "components/admin/order-detail";
import Footer from "components/layout/footer";
import { adminOrdersRepository } from "lib/admin/orders-repository";

export const metadata: Metadata = {
  title: "Admin — Detalle del pedido",
  robots: { index: false, follow: false },
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await adminOrdersRepository.getById(id);
  if (!order) notFound();

  return (
    <>
      <AdminShell title={`Pedido #${order.orderNumber}`}>
        <OrderDetail initialOrder={order} />
      </AdminShell>
      <Footer />
    </>
  );
}
