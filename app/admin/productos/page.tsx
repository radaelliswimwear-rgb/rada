import type { Metadata } from "next";
import { AdminShell } from "components/admin/admin-shell";
import { ProductsTable } from "components/admin/products-table";
import Footer from "components/layout/footer";
import { adminProductsRepository } from "lib/admin/products-repository";

export const metadata: Metadata = {
  title: "Admin — Productos",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const products = await adminProductsRepository.listAll();

  return (
    <>
      <AdminShell title="Productos">
        <ProductsTable initialProducts={products} />
      </AdminShell>
      <Footer />
    </>
  );
}
