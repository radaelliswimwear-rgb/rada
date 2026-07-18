"use client";

import { Dialog, Transition } from "@headlessui/react";
import {
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { Money } from "components/currency/money";
import { useLocalCart } from "./cart-store";

export function CartDrawer() {
  const { lines, isOpen, closeCart, totalAmount, removeItem, updateQuantity } =
    useLocalCart();

  if (!isOpen) return null;

  return (
    <Dialog open onClose={closeCart} className="relative z-50">
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
        enter="transition-all ease-in-out duration-300"
        enterFrom="translate-x-full"
        enterTo="translate-x-0"
        leave="transition-all ease-in-out duration-200"
        leaveFrom="translate-x-0"
        leaveTo="translate-x-full"
      >
        <Dialog.Panel className="fixed bottom-0 right-0 top-0 flex h-full w-full flex-col border-l border-neutral-200 bg-white/95 p-6 backdrop-blur-xl md:w-[400px]">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">Tu carrito</p>
            <button
              onClick={closeCart}
              aria-label="Cerrar carrito"
              className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-900"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {lines.length === 0 ? (
            <div className="mt-20 flex flex-1 flex-col items-center justify-center text-center">
              <ShoppingBagIcon className="h-14 w-14 text-neutral-300" />
              <p className="mt-6 text-lg font-medium">Tu carrito está vacío</p>
              <p className="mt-1 text-sm text-neutral-500">
                Descubrí la colección y agregá tus favoritos.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden">
              <ul className="flex-1 overflow-y-auto py-6">
                {lines.map((line) => (
                  <li
                    key={line.id}
                    className="flex gap-3 border-b border-neutral-200 py-4"
                  >
                    <div className="relative h-20 w-16 flex-none overflow-hidden rounded-md bg-neutral-100">
                      <Image
                        src={line.product.images[0]!}
                        alt={line.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/producto/${line.product.slug}`}
                          onClick={closeCart}
                          className="text-sm hover:underline"
                        >
                          {line.product.name}
                        </Link>
                        <button
                          onClick={() => removeItem(line.id)}
                          aria-label="Quitar producto"
                          className="text-neutral-400 transition-colors hover:text-neutral-900"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-neutral-500">
                        Talla {line.size}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-full border border-neutral-300 px-1">
                          <button
                            onClick={() =>
                              updateQuantity(line.id, line.quantity - 1)
                            }
                            aria-label="Restar cantidad"
                            className="flex h-6 w-6 items-center justify-center"
                          >
                            <MinusIcon className="h-3 w-3" />
                          </button>
                          <span className="w-4 text-center text-xs">
                            {line.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(line.id, line.quantity + 1)
                            }
                            aria-label="Sumar cantidad"
                            className="flex h-6 w-6 items-center justify-center"
                          >
                            <PlusIcon className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-medium">
                          <Money amountCop={line.product.priceValue * line.quantity} />
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="font-medium">
                    <Money amountCop={totalAmount} />
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Envío calculado en el checkout.
                </p>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="mt-4 flex w-full items-center justify-center rounded-full bg-brand-coral p-4 text-sm font-medium tracking-wide text-white transition-colors duration-200 hover:bg-brand-crimson"
                >
                  Finalizar compra
                </Link>
              </div>
            </div>
          )}
        </Dialog.Panel>
      </Transition.Child>
    </Dialog>
  );
}
