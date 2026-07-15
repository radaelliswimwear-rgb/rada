import type { Metadata } from "next";
import { AdminShell } from "components/admin/admin-shell";
import { CategoriesTable } from "components/admin/categories-table";
import Footer from "components/layout/footer";
import { adminCategoriesRepository } from "lib/admin/categories-repository";

export const metadata: Metadata = {
  title: "Admin — Categorías",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const categories = await adminCategoriesRepository.listAll();

  return (
    <>
      <AdminShell title="Categorías">
        <CategoriesTable initialCategories={categories} />
      </AdminShell>
      <Footer />
    </>
  );
}
