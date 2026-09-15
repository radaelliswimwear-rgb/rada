import Footer from "components/layout/footer";
import { ProductCard } from "components/home/product-card";
import { RecentlyViewed } from "components/catalog/recently-viewed";
import { Gallery } from "components/product/gallery";
import { DiscountedMoney } from "components/currency/discounted-money";
import { Accordion } from "components/ui/accordion";
import { catalogRepository } from "lib/catalog/catalog-repository";
import { CATEGORY_SLUG_BY_LABEL } from "lib/catalog/types";
import { getDisplayedTotalViews } from "lib/catalog/view-display";
import { settingsRepository } from "lib/currency/settings-repository";
import { formatPrice } from "lib/format";
import type { PlaceholderProduct } from "lib/placeholder-data";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Suspense } from "react";
import { LiveViewers } from "./live-viewers";
import { ProductMeta } from "./product-meta";
import { ProductVariantPicker } from "./product-variant-picker";
import { ProductWishlistButton } from "./product-wishlist-button";
import { ViewTracker } from "./view-tracker";

export async function ProductDetail({
  product,
  initialSize,
}: {
  product: PlaceholderProduct;
  // ?talla= en la URL (ver app/producto/[slug]/page.tsx) — la usa el link
  // "Comprar ahora" del correo de "Avísame cuando vuelva" para reabrir la
  // ficha con la talla que la clienta pidió ya seleccionada.
  initialSize?: string;
}) {
  const relatedProducts = await catalogRepository.listRelated(product);
  // La guía de tallas subida en /admin/configuracion es única para toda la
  // tienda a nivel de dato, pero por ahora solo aplica a Oasis Natural (la
  // única colección para la que la fundadora la armó) — las demás
  // colecciones quedan exactamente igual que antes, sin el botón.
  const settings = await settingsRepository.get();
  const sizeGuideImage =
    product.category === "Oasis Natural" ? settings.sizeGuideImage : null;
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
                <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden lg:max-h-[640px]" />
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

          <div className="basis-full space-y-8 lg:basis-2/6">
            {/* Jerarquía "arriba del fold" (Touché, Reformation, Vitamin A):
                nombre, precio, disponibilidad, color/talla y el botón de
                compra van siempre visibles y primero — el texto largo de
                product.description (un solo campo libre que escribe la
                fundadora, sin estructura fija) se movió más abajo, dentro
                de un acordeón, para resolver la sensación de "demasiado
                texto" sin quitarle una sola palabra a lo que ella escribió. */}
            <div>
              <h1 className="mb-2 text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-2xl font-medium text-neutral-900">
                  <DiscountedMoney
                    amountCop={product.priceValue}
                    originalAmountCop={product.originalPriceValue ?? product.priceValue}
                    discountPercent={product.activeDiscountPercent ?? 0}
                  />
                </p>
                <ProductWishlistButton productId={product.id} />
              </div>
            </div>

            <ProductMeta
              totalStock={totalStock}
              sku={product.sku}
              showViews={product.showViews ?? true}
              totalViews={totalViews}
              liveViewers={<LiveViewers productId={product.id} />}
            />

            <ProductVariantPicker
              product={product}
              totalStock={totalStock}
              sizeGuideImage={sizeGuideImage}
              initialSize={initialSize}
            />

            <div>
              <Accordion title="Descripción">
                <p className="whitespace-pre-line">{product.description}</p>
              </Accordion>
              <Accordion title="Cuidados de la prenda">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Lavar a mano con agua fría.</li>
                  <li>No usar blanqueador.</li>
                  <li>No retorcer.</li>
                  <li>Secar a la sombra.</li>
                  <li>Evitar el contacto con superficies ásperas.</li>
                </ul>
              </Accordion>
              <Accordion title="Envíos, devoluciones y garantía">
                <p>
                  Envío gratis en compras desde{" "}
                  {formatPrice(settings.freeShippingThreshold)}. Por debajo de
                  ese monto, el valor del envío se informa antes del despacho,
                  según tu destino. Garantía de 12 meses por defectos de
                  fabricación o calidad.
                </p>
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  <Link
                    href="/envios"
                    className="font-medium text-neutral-900 underline underline-offset-2 hover:text-brand-crimson"
                  >
                    Política de envíos
                  </Link>
                  <Link
                    href="/devoluciones"
                    className="font-medium text-neutral-900 underline underline-offset-2 hover:text-brand-crimson"
                  >
                    Política de devoluciones
                  </Link>
                  <Link
                    href="/garantia"
                    className="font-medium text-neutral-900 underline underline-offset-2 hover:text-brand-crimson"
                  >
                    Política de garantía
                  </Link>
                </p>
              </Accordion>
              <Accordion title="Métodos de pago">
                <p>
                  Paga de forma segura a través de Wompi con tarjetas de
                  crédito y débito Visa, Mastercard y American Express, PSE,
                  Nequi o Botón Bancolombia.
                </p>
              </Accordion>
            </div>
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
