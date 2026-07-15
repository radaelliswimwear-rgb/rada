import { ProductDetail } from "components/product-detail/product-detail";
import { getProductBySlug, products } from "lib/placeholder-data";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const product = getProductBySlug(params.slug);

  if (!product) return {};

  return {
    title: product.name,
    description: product.description,
    openGraph: product.images[0]
      ? { images: [{ url: product.images[0] }] }
      : undefined,
  };
}

export default async function ProductoPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const product = getProductBySlug(params.slug);

  if (!product) return notFound();

  return <ProductDetail product={product} />;
}
