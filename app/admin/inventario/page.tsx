import type { Metadata } from "next";
import { AdminShell } from "components/admin/admin-shell";
import { InventoryTable } from "components/admin/inventory-table";
import Footer from "components/layout/footer";
import { adminInventoryRepository } from "lib/admin/inventory-repository";

export const metadata: Metadata = {
  title: "Admin — Inventario",
  robots: { index: false, follow: false },
};

export default async function AdminInventoryPage() {
  const variants = await adminInventoryRepository.listAll();

  return (
    <>
      <AdminShell title="Inventario">
        <InventoryTable initialVariants={variants} />
      </AdminShell>
      <Footer />
    </>
  );
}
