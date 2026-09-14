"use client";

import {
  UserIcon,
  ShoppingBagIcon,
  HeartIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { CartDrawer } from "components/cart-drawer/cart-drawer";
import { CurrencySelector } from "components/currency/currency-selector";
import { useLocalCart } from "components/cart-drawer/cart-store";
import { useWishlist } from "components/wishlist/wishlist-store";
import { useAuth } from "components/auth/auth-store";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  WhatsappIcon,
} from "components/icons/social-icons";
import { SOCIAL_LINKS } from "lib/social-links";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import MobileMenu from "./mobile-menu";
import NavSearch from "./search";

const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TiktokIcon,
  whatsapp: WhatsappIcon,
};

// Colecciones y Contacto quedan fuera del menú principal (a pedido del
// cliente, para que el logo más grande y las categorías no se superpongan
// en el header) — siguen accesibles por URL directa y desde el footer.
// Las categorías (Hombre, Mujer, Oasis Natural, etc.) ya NO son un array
// fijo acá: se arman a partir de Category.active (Panel Admin ->
// /admin/categorias, ver lib/catalog/catalog-actions.ts) y llegan como
// prop desde app/layout.tsx, así activar/desactivar una categoría cambia
// el menú sin tocar código.
export type NavCategory = { slug: string; name: string };

export function Navbar({
  categories = [],
}: {
  categories?: NavCategory[];
}) {
  const navLinks = [
    { label: "Inicio", href: "/" },
    ...categories.map((category) => ({
      label: category.name,
      href: `/${category.slug}`,
    })),
  ];
  const [scrolled, setScrolled] = useState(false);
  const { totalQuantity, openCart } = useLocalCart();
  const { items: wishlistItems } = useWishlist();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300",
        scrolled
          ? "border-neutral-200 bg-white/90 shadow-sm"
          : "border-transparent bg-white/70",
      )}
    >
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 lg:px-8">
        <div className="flex flex-1 items-center lg:hidden">
          <MobileMenu links={navLinks} />
        </div>

        <a
          href="/"
          aria-label="Radaelli Swimwear — inicio"
          className="relative h-20 w-56 flex-none py-1"
        >
          <Image
            src="/logo/radaelli-swimwear.png"
            alt="Radaelli Swimwear"
            fill
            priority
            sizes="224px"
            className="object-contain"
          />
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-5 lg:flex lg:gap-7">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="whitespace-nowrap text-xs tracking-wide text-neutral-600 transition-colors duration-200 hover:text-brand-crimson lg:text-sm"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1">
          <div className="hidden lg:block">
            <NavSearch />
          </div>
          <div className="hidden xl:block">
            <CurrencySelector />
          </div>
          {SOCIAL_LINKS.map((social) => {
            const Icon = SOCIAL_ICONS[social.key];
            return (
              <a
                key={social.key}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="hidden h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 xl:flex"
              >
                <Icon className="h-5 w-5" />
              </a>
            );
          })}
          <Link
            href="/favoritos"
            aria-label="Favoritos"
            className="relative hidden h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 lg:flex"
          >
            <HeartIcon className="h-5 w-5" />
            {wishlistItems.length > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-crimson text-[9px] font-medium text-white">
                {wishlistItems.length}
              </span>
            ) : null}
          </Link>
          <Link
            href={isAuthenticated ? "/cuenta" : "/cuenta/iniciar-sesion"}
            aria-label="Cuenta"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 lg:flex"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              aria-label="Panel administrativo"
              title="Admin"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 lg:flex"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </Link>
          ) : null}
          <button
            type="button"
            aria-label="Carrito"
            onClick={openCart}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors duration-200 hover:bg-neutral-100"
          >
            <ShoppingBagIcon className="h-5 w-5" />
            {totalQuantity > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-crimson text-[9px] font-medium text-white">
                {totalQuantity}
              </span>
            ) : null}
          </button>
        </div>
      </div>
      <CartDrawer />
    </header>
  );
}
