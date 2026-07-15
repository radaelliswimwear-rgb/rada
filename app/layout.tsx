import { CartProvider } from "components/cart/cart-context";
import { LocalCartProvider } from "components/cart-drawer/cart-store";
import { WishlistProvider } from "components/wishlist/wishlist-store";
import { AuthProvider } from "components/auth/auth-store";
import { Navbar } from "components/layout/navbar";
import { GeistSans } from "geist/font/sans";
import { getCart } from "lib/shopify";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { baseUrl } from "lib/utils";

const SITE_NAME = process.env.SITE_NAME || "LAGO";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  robots: {
    follow: true,
    index: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Don't await the fetch, pass the Promise to the context provider
  const cart = getCart();

  return (
    <html lang="es" className={`${GeistSans.variable} scroll-smooth`}>
      <body className="bg-white text-black selection:bg-black selection:text-white dark:bg-neutral-950 dark:text-white dark:selection:bg-white dark:selection:text-black">
        <CartProvider cartPromise={cart}>
          <LocalCartProvider>
            <WishlistProvider>
              <AuthProvider>
                <Navbar />
                <main>{children}</main>
                <Toaster closeButton position="bottom-right" />
              </AuthProvider>
            </WishlistProvider>
          </LocalCartProvider>
        </CartProvider>
      </body>
    </html>
  );
}
