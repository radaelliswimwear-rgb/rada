import { CartProvider } from "components/cart/cart-context";
import { LocalCartProvider } from "components/cart-drawer/cart-store";
import { WishlistProvider } from "components/wishlist/wishlist-store";
import { AuthProvider } from "components/auth/auth-store";
import { CurrencyProvider } from "components/currency/currency-store";
import { DiscountAnnouncementBar } from "components/layout/discount-announcement-bar";
import { Navbar } from "components/layout/navbar";
import { Poppins } from "next/font/google";

// Tipografía de marca Radaelli Swimwear (rebrand): "Mont" es una fuente comercial sin
// licencia disponible en este proyecto — Poppins es la alternativa
// gratuita más cercana (misma familia geométrica, mismos pesos
// Semibold/Regular que "Mont Semibold"/"Mont Book" de la guía de marca).
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});
import { getCart } from "lib/shopify";
import { catalogRepository } from "lib/catalog/catalog-repository";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { getAppBaseUrl } from "lib/utils";
import { JsonLd } from "lib/seo/json-ld";
import {
  SITE_DESCRIPTION,
  SITE_LOGO,
  SITE_NAME as BRAND_NAME,
  SITE_URL,
} from "lib/seo/site";

const SITE_NAME = process.env.SITE_NAME || "Radaelli Swimwear";

export const metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    follow: true,
    index: true,
  },
};

// Organization + WebSite (Sprint 17): datos estructurados a nivel de sitio,
// una sola vez en el layout raíz — cada página que necesita su propio
// schema.org (Product, Article) agrega el suyo además de este, no en
// reemplazo.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND_NAME,
  url: SITE_URL,
  logo: SITE_LOGO,
  description: SITE_DESCRIPTION,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/buscar?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Don't await the fetch, pass the Promise to the context provider
  const cart = getCart();
  const activeCategories = await catalogRepository.listActiveCategories();

  return (
    <html
      lang="es"
      className={`${poppins.variable} ${poppins.className} scroll-smooth`}
    >
      <body className="bg-white text-neutral-900 selection:bg-brand-coral selection:text-white">
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-brand-coral focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Saltar al contenido principal
        </a>
        <CartProvider cartPromise={cart}>
          <LocalCartProvider>
            <WishlistProvider>
              <AuthProvider>
                <CurrencyProvider>
                  <DiscountAnnouncementBar />
                  <Navbar categories={activeCategories} />
                  <main id="main-content">{children}</main>
                  <Toaster closeButton position="bottom-right" />
                </CurrencyProvider>
              </AuthProvider>
            </WishlistProvider>
          </LocalCartProvider>
        </CartProvider>
      </body>
    </html>
  );
}
