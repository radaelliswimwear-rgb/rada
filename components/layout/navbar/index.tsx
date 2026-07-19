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
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import MobileMenu from "./mobile-menu";
import NavSearch from "./search";

// TODO: el Instagram real se agrega después (pedido del cliente) — por
// ahora se usa @stickgmzz como placeholder para poder publicar el ícono.
const INSTAGRAM_URL = "https://instagram.com/stickgmzz";
const WHATSAPP_URL = "https://wa.me/573006683190";

export const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Hombre", href: "/hombre" },
  { label: "Mujer", href: "/mujer" },
  { label: "Niños", href: "/ninos" },
  { label: "Calzado", href: "/calzado" },
  { label: "Accesorios", href: "/accesorios" },
  { label: "Colecciones", href: "/#productos" },
  { label: "Contacto", href: "/#contacto" },
] as const;

export function Navbar() {
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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <div className="flex flex-1 items-center md:hidden">
          <MobileMenu links={NAV_LINKS} />
        </div>

        <a
          href="/"
          aria-label="LAGO — inicio"
          className="relative h-10 w-28 flex-none"
        >
          <Image
            src="/logo/laura-gomez.png"
            alt="Laura Gómez"
            fill
            priority
            sizes="112px"
            className="object-contain"
          />
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm tracking-wide text-neutral-600 transition-colors duration-200 hover:text-brand-crimson"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1">
          <div className="hidden md:block">
            <NavSearch />
          </div>
          <div className="hidden md:block">
            <CurrencySelector />
          </div>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 md:flex"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-5 w-5"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 md:flex"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.41-1.42a9.87 9.87 0 0 0 4.63 1.18h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.06h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.11.82.83-3.03-.2-.31a8.16 8.16 0 0 1-1.25-4.3c0-4.53 3.7-8.22 8.24-8.22 2.2 0 4.27.86 5.82 2.42a8.15 8.15 0 0 1 2.41 5.81c0 4.53-3.7 8.22-8.24 8.22Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.48-.01s-.43.06-.66.31c-.23.25-.86.85-.86 2.07s.89 2.4 1.01 2.57c.12.16 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.23-.16-.48-.28Z" />
            </svg>
          </a>
          <Link
            href="/favoritos"
            aria-label="Favoritos"
            className="relative hidden h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 md:flex"
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
            className="hidden h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 md:flex"
          >
            <UserIcon className="h-5 w-5" />
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              aria-label="Panel administrativo"
              title="Admin"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 md:flex"
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
