import { ProductDetail } from "components/product-detail/product-detail";
import { catalogRepository } from "lib/catalog/catalog-repository";
import { JsonLd } from "lib/seo/json-ld";
import { SITE_URL } from "lib/seo/site";
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

  const url = `${SITE_URL}/producto/${product.slug}`;

  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: product.name,
      description: product.description,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: product.images[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductoPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const product = await catalogRepository.getBySlug(params.slug);

  if (!product) return notFound();

  const inStock = product.sizes.length > 0;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.id,
    color: product.color,
    category: product.category,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/producto/${product.slug}`,
      priceCurrency: "COP",
      price: product.priceValue.toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <JsonLd data={productJsonLd} />
      <ProductDetail product={product} />
    </>
  );
}
