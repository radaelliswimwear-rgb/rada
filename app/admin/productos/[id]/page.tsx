import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "components/admin/admin-shell";
import { ProductForm } from "components/admin/product-form";
import Footer from "components/layout/footer";
import { adminProductsRepository } from "lib/admin/products-repository";
import type { AdminProductInput } from "lib/admin/types";

export const metadata: Metadata = {
  title: "Admin — Editar producto",
  robots: { index: false, follow: false },
};

export default async function EditAdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await adminProductsRepository.getById(id);
  if (!product) notFound();

  const initialValues: AdminProductInput = {
    slug: product.slug,
    name: product.name,
    category: product.category,
    priceValue: product.priceValue,
    discountPercent: product.discountPercent,
    color: product.color,
    description: product.description,
    featured: product.featured,
    images: product.images,
    sizes: product.variants.map((variant) => variant.size),
    sku: product.sku,
    promotionalViews: product.promotionalViews,
    showViews: product.showViews,
  };

  return (
    <>
      <AdminShell title="Editar producto">
        <ProductForm
          productId={product.id}
          initialValues={initialValues}
          stats={{
            realViews: product.realViews,
            totalStock: product.totalStock,
          }}
        />
      </AdminShell>
      <Footer />
    </>
  );
}
