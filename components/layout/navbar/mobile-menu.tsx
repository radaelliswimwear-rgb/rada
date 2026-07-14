"use client";

import { Dialog, Transition } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { Fragment, useState } from "react";
import { toast } from "sonner";

type NavLink = { label: string; href: string };

export default function MobileMenu({ links }: { links: readonly NavLink[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú"
        className="flex h-10 w-10 items-center justify-center rounded-full text-black transition-colors duration-200 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-900"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>
      <Transition show={isOpen}>
        <Dialog onClose={closeMenu} className="relative z-50">
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
            <Dialog.Panel className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white p-6 dark:bg-neutral-950">
              <div className="mb-8 flex items-center justify-between">
                <div className="relative h-9 w-9 overflow-hidden rounded-md ring-1 ring-black/10 dark:ring-white/15">
                  <Image
                    src="/logo/logo-principal.png"
                    alt="LAGO — Laura Gómez"
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </div>
                <button
                  onClick={closeMenu}
                  aria-label="Cerrar menú"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-black dark:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast("La búsqueda estará disponible muy pronto.");
                  closeMenu();
                }}
                className="relative mb-6"
              >
                <input
                  type="text"
                  name="q"
                  placeholder="Buscar..."
                  autoComplete="off"
                  className="w-full rounded-full border border-neutral-300 bg-transparent px-4 py-2.5 pr-10 text-sm text-black placeholder:text-neutral-400 focus:outline-none dark:border-neutral-700 dark:text-white"
                />
                <MagnifyingGlassIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              </form>

              <nav className="flex flex-col gap-1">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={closeMenu}
                    className="rounded-md px-2 py-3 text-lg text-neutral-800 transition-colors duration-200 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-900"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="mt-auto flex gap-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
                <button
                  onClick={() =>
                    toast("Tu cuenta estará disponible muy pronto.")
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-neutral-300 py-2.5 text-sm text-black dark:border-neutral-700 dark:text-white"
                >
                  <UserIcon className="h-4 w-4" /> Cuenta
                </button>
                <button
                  onClick={() =>
                    toast("El carrito estará disponible muy pronto.")
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-neutral-300 py-2.5 text-sm text-black dark:border-neutral-700 dark:text-white"
                >
                  <ShoppingBagIcon className="h-4 w-4" /> Carrito
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}
