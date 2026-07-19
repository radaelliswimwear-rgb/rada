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
