import Footer from "components/layout/footer";
import { ProductCard } from "components/home/product-card";
import { RecentlyViewed } from "components/catalog/recently-viewed";
import { Gallery } from "components/product/gallery";
import { Money } from "components/currency/money";
import { catalogRepository } from "lib/catalog/catalog-repository";
import { CATEGORY_SLUG_BY_LABEL } from "lib/catalog/types";
import { getDisplayedTotalViews } from "lib/catalog/view-display";
import type { PlaceholderProduct } from "lib/placeholder-data";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Suspense } from "react";
import { LiveViewers } from "./live-viewers";
import { ProductMeta } from "./product-meta";
import { ProductVariantPicker } from "./product-variant-picker";
import { ViewTracker } from "./view-tracker";

export async function ProductDetail({
  product,
}: {
  product: PlaceholderProduct;
}) {
  const relatedProducts = await catalogRepository.listRelated(product);
  // Antes usaba product.category.toLowerCase() — rompía para categorías con
  // espacio en el nombre ("Aurora Viva" -> "aurora viva", una URL inválida
  // con %20 en vez del slug real "aurora-viva"), causando el error de la
  // ficha de producto. El slug es la única fuente correcta, igual que en
  // catalog-page.tsx.
  const categoryHref = `/${CATEGORY_SLUG_BY_LABEL[product.category]}`;
  const totalStock = product.totalStock ?? 0;
  const totalViews = getDisplayedTotalViews(
    product.realViews ?? 0,
    product.promotionalViews ?? 0,
  );

  return (
    <>
      <ViewTracker productId={product.id} />
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {/* Botón "volver a la colección" — patrón estándar en tiendas de
            trajes de baño (Cupshe, Andie Swim, Reformation, etc.): un link
            con flecha bien visible arriba de la ficha, no solo la miga de
            pan chiquita, para que sea obvio cómo regresar sin usar el botón
            "atrás" del navegador. */}
        <Link
          href={categoryHref}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-600 transition-colors duration-200 hover:text-brand-crimson"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver a {product.category}
        </Link>

        <nav aria-label="Miga de pan" className="mb-6 text-xs text-neutral-500">
          <Link href="/" className="hover:text-brand-crimson">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <Link href={categoryHref} className="hover:text-brand-crimson">
            {product.category}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-800">{product.name}</span>
        </nav>

        <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 lg:flex-row lg:gap-8">
          <div className="h-full w-full basis-full lg:basis-4/6">
            <Suspense
              fallback={
                <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden" />
              }
            >
              <Gallery
                images={product.images.map((src) => ({
                  src,
                  altText: product.name,
                }))}
              />
            </Suspense>
          </div>

          <div className="basis-full lg:basis-2/6">
            <div className="mb-6 flex flex-col border-b border-neutral-200 pb-6">
              <h1 className="mb-2 text-4xl font-semibold tracking-tight text-neutral-900">
                {product.name}
              </h1>
              <div className="mr-auto w-auto rounded-full bg-brand-coral px-4 py-2 text-sm font-medium text-white">
                <Money amountCop={product.priceValue} />
              </div>
            </div>
            <ProductMeta
              totalStock={totalStock}
              sku={product.sku}
              showViews={product.showViews ?? true}
              totalViews={totalViews}
              liveViewers={<LiveViewers productId={product.id} />}
            />
            <p className="mb-6 text-sm leading-relaxed text-neutral-600">
              {product.description}
            </p>
            <ProductVariantPicker product={product} totalStock={totalStock} />
          </div>
        </div>

        {relatedProducts.length > 0 ? (
          <div className="py-12">
            <h2 className="mb-6 text-2xl font-semibold tracking-tight">
              También te puede interesar
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </div>
        ) : null}

        <RecentlyViewed
          current={{
            slug: product.slug,
            name: product.name,
            image: product.images[0] ?? "",
            price: product.price,
            category: product.category,
          }}
        />
      </div>
      <Footer />
    </>
  );
}
