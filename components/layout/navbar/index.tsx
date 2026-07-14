"use client";

import { UserIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import MobileMenu from "./mobile-menu";
import NavSearch from "./search";

export const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Hombre", href: "/hombre" },
  { label: "Mujer", href: "/mujer" },
  { label: "Colecciones", href: "/#productos" },
  { label: "Contacto", href: "/#contacto" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

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
          ? "border-neutral-200 bg-white/90 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/90"
          : "border-transparent bg-white/70 dark:bg-neutral-950/70",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <div className="flex flex-1 items-center md:hidden">
          <MobileMenu links={NAV_LINKS} />
        </div>

        <a
          href="/"
          aria-label="LAGO — inicio"
          className="relative h-10 w-10 flex-none overflow-hidden rounded-md ring-1 ring-black/10 dark:ring-white/15"
        >
          <Image
            src="/logo/logo-principal.png"
            alt="LAGO — Laura Gómez"
            fill
            priority
            sizes="40px"
            className="object-cover"
          />
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm tracking-wide text-neutral-600 transition-colors duration-200 hover:text-black dark:text-neutral-300 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1">
          <div className="hidden md:block">
            <NavSearch />
          </div>
          <button
            type="button"
            aria-label="Cuenta"
            onClick={() => toast("Tu cuenta estará disponible muy pronto.")}
            className="hidden h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 md:flex dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            <UserIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Carrito"
            onClick={() => toast("El carrito estará disponible muy pronto.")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            <ShoppingBagIcon className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-medium text-white dark:bg-white dark:text-black">
              0
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
