import { ProductDetail } from "components/product-detail/product-detail";
import { catalogRepository } from "lib/catalog/catalog-repository";
import { CATEGORY_SLUG_BY_LABEL } from "lib/catalog/types";
import { JsonLd } from "lib/seo/json-ld";
import {
  buildProductBreadcrumbJsonLd,
  buildProductJsonLd,
} from "lib/seo/product-json-ld";
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
  searchParams: Promise<{ talla?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const product = await catalogRepository.getBySlug(params.slug);

  if (!product) return notFound();

  const productJsonLd = buildProductJsonLd({
    name: product.name,
    description: product.description,
    images: product.images,
    sku: product.sku,
    color: product.color,
    category: product.category,
    priceValue: product.priceValue,
    totalStock: product.totalStock,
    slug: product.slug,
    siteUrl: SITE_URL,
  });

  const breadcrumbJsonLd = buildProductBreadcrumbJsonLd({
    siteUrl: SITE_URL,
    categoryLabel: product.category,
    categorySlug: CATEGORY_SLUG_BY_LABEL[product.category],
    productName: product.name,
    productSlug: product.slug,
  });

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <ProductDetail product={product} initialSize={searchParams.talla} />
    </>
  );
}
