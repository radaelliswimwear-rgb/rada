"use client";

import { Dialog, Transition } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UserIcon,
  HeartIcon,
  Bars3Icon,
  Cog6ToothIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useLocalCart } from "components/cart-drawer/cart-store";
import { useWishlist } from "components/wishlist/wishlist-store";
import { useAuth } from "components/auth/auth-store";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useState } from "react";

type NavLink = { label: string; href: string };

export default function MobileMenu({ links }: { links: readonly NavLink[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const { totalQuantity, openCart } = useLocalCart();
  const { items: wishlistItems } = useWishlist();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú"
        className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors duration-200 hover:bg-neutral-100"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>
      {isOpen ? (
        <Dialog open onClose={closeMenu} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in-out duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition-transform ease-in-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white p-6">
              <div className="mb-8 flex items-center justify-between">
                <div className="relative h-14 w-40">
                  <Image
                    src="/logo/radaelli-swimwear.png"
                    alt="Radaelli Swimwear"
                    fill
                    sizes="160px"
                    className="object-contain"
                  />
                </div>
                <button
                  onClick={closeMenu}
                  aria-label="Cerrar menú"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-900"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <Form
                action="/buscar"
                onSubmit={closeMenu}
                className="relative mb-6"
              >
                <input
                  type="text"
                  name="q"
                  placeholder="Buscar..."
                  autoComplete="off"
                  className="w-full rounded-full border border-neutral-300 bg-transparent px-4 py-2.5 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                />
                <MagnifyingGlassIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              </Form>

              <nav className="flex flex-col gap-1">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={closeMenu}
                    className="rounded-md px-2 py-3 text-lg text-neutral-800 transition-colors duration-200 hover:bg-neutral-100"
                  >
                    {link.label}
                  </a>
                ))}
                {isAdmin ? (
                  <Link
                    href="/admin"
                    onClick={closeMenu}
                    className="flex items-center gap-2 rounded-md px-2 py-3 text-lg text-neutral-800 transition-colors duration-200 hover:bg-neutral-100"
                  >
                    <Cog6ToothIcon className="h-5 w-5" />
                    Admin
                  </Link>
                ) : null}
              </nav>

              <div className="mt-auto flex gap-2 border-t border-neutral-200 pt-6">
                <Link
                  href={isAuthenticated ? "/cuenta" : "/cuenta/iniciar-sesion"}
                  onClick={closeMenu}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-neutral-300 py-2.5 text-sm text-neutral-900"
                >
                  <UserIcon className="h-4 w-4" /> Cuenta
                </Link>
                <Link
                  href="/favoritos"
                  onClick={closeMenu}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-neutral-300 py-2.5 text-sm text-neutral-900"
                >
                  <HeartIcon className="h-4 w-4" />
                  Favoritos
                  {wishlistItems.length > 0 ? ` (${wishlistItems.length})` : ""}
                </Link>
                <button
                  onClick={() => {
                    closeMenu();
                    openCart();
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-neutral-300 py-2.5 text-sm text-neutral-900"
                >
                  <ShoppingBagIcon className="h-4 w-4" />
                  Carrito{totalQuantity > 0 ? ` (${totalQuantity})` : ""}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      ) : null}
    </>
  );
}
