"use client";

import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { Money } from "components/currency/money";
import { ProductVariantPicker } from "components/product-detail/product-variant-picker";
import type { PlaceholderProduct } from "lib/placeholder-data";

export function QuickViewModal({
  product,
  isOpen,
  onClose,
}: {
  product: PlaceholderProduct | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !product) return null;

  return (
    <Dialog open onClose={onClose} className="relative z-[60]">
      <Transition.Child
        as={Fragment}
        enter="transition-opacity ease-in-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-in-out duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      </Transition.Child>

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Transition.Child
          as={Fragment}
          enter="transition-all ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition-all ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Dialog.Panel className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:flex-row dark:bg-neutral-950">
            <button
              onClick={onClose}
              aria-label="Cerrar vista rápida"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black dark:bg-black/80 dark:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="relative aspect-square w-full flex-none sm:w-1/2">
              <Image
                src={product.images[0]!}
                alt={product.name}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="flex w-full flex-col overflow-y-auto p-6 sm:w-1/2 sm:p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                {product.category}
              </p>
              <h2 className="mb-2 mt-1 text-2xl font-semibold tracking-tight">
                {product.name}
              </h2>
              <div className="mb-4 w-auto self-start rounded-full bg-black p-2 text-sm text-white dark:bg-white dark:text-black">
                <Money amountCop={product.priceValue} />
              </div>
              <p className="mb-6 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {product.description}
              </p>

              <ProductVariantPicker product={product} onAdded={onClose} />

              <Link
                href={`/producto/${product.slug}`}
                onClick={onClose}
                className="mt-4 text-center text-xs text-neutral-500 underline-offset-4 hover:underline"
              >
                Ver ficha completa
              </Link>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </div>
    </Dialog>
  );
}
