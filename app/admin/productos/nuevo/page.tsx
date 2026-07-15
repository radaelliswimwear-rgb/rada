import type { Metadata } from "next";
import { AdminShell } from "components/admin/admin-shell";
import { ProductForm } from "components/admin/product-form";
import Footer from "components/layout/footer";

export const metadata: Metadata = {
  title: "Admin — Nuevo producto",
  robots: { index: false, follow: false },
};

export default function NewAdminProductPage() {
  return (
    <>
      <AdminShell title="Nuevo producto">
        <ProductForm />
      </AdminShell>
      <Footer />
    </>
  );
}
