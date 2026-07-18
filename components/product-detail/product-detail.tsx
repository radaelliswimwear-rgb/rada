import Footer from "components/layout/footer";
import { ProductCard } from "components/home/product-card";
import { RecentlyViewed } from "components/catalog/recently-viewed";
import { Gallery } from "components/product/gallery";
import { Money } from "components/currency/money";
import { catalogRepository } from "lib/catalog/catalog-repository";
import type { PlaceholderProduct } from "lib/placeholder-data";
import Link from "next/link";
import { Suspense } from "react";
import { ProductVariantPicker } from "./product-variant-picker";

export async function ProductDetail({
  product,
}: {
  product: PlaceholderProduct;
}) {
  const relatedProducts = await catalogRepository.listRelated(product);
  const categoryHref = `/${product.category.toLowerCase()}`;

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <nav aria-label="Miga de pan" className="mb-6 text-xs text-neutral-500">
          <Link href="/" className="hover:text-black dark:hover:text-white">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={categoryHref}
            className="hover:text-black dark:hover:text-white"
          >
            {product.category}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-800 dark:text-neutral-300">
            {product.name}
          </span>
        </nav>

        <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 lg:flex-row lg:gap-8 dark:border-neutral-800 dark:bg-black">
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
            <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
              <h1 className="mb-2 text-4xl font-semibold tracking-tight">
                {product.name}
              </h1>
              <div className="mr-auto w-auto rounded-full bg-black p-2 text-sm text-white dark:bg-white dark:text-black">
                <Money amountCop={product.priceValue} />
              </div>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {product.description}
            </p>
            <ProductVariantPicker product={product} />
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
