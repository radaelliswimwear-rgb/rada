import { ProductDetail } from "components/product-detail/product-detail";
import { catalogRepository } from "lib/catalog/catalog-repository";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const slugs = await catalogRepository.listSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const product = await catalogRepository.getBySlug(params.slug);

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
  const product = await catalogRepository.getBySlug(params.slug);

  if (!product) return notFound();

  return <ProductDetail product={product} />;
}
