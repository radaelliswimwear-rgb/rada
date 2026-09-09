"use client";

import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { Fragment, useEffect, useState } from "react";
import type { SizeGuideImage } from "lib/currency/settings-actions";

// Botón + modal reutilizables para la guía de tallas única de la tienda
// (subida una sola vez en /admin/configuracion) — reemplaza la práctica
// anterior de meter la tabla de tallas como una foto más en la galería de
// cada producto, que se veía mal mezclada con las fotos reales de la
// prenda. Si la fundadora todavía no subió la imagen, el botón no se
// renderiza (ver ProductVariantPicker).
export function SizeGuideModal({
  image,
  triggerClassName,
}: {
  image: SizeGuideImage;
  // El botón se reutiliza en dos lugares con estilos distintos: junto al
  // selector de Talla (label chico en mayúsculas) y en el footer (mismo
  // estilo que los demás links de "Ayuda") — ver product-variant-picker.tsx
  // y footer.tsx.
  triggerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  // El modal (Transition envolviendo Dialog, para poder animar también el
  // cierre) solo se monta después de hidratar en el cliente — montarlo ya
  // en el HTML del servidor hace que Headless UI reserve ids (useId) que no
  // coinciden con los que genera al hidratar, lo que dispara un error de
  // hydration mismatch en los Accordion vecinos (afecta el conteo de ids de
  // toda la página, no solo de este componente). Como nadie puede hacer
  // clic en "Guía de tallas" antes de que la página termine de hidratarse,
  // no hay pérdida de funcionalidad real.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          triggerClassName ??
          "text-xs uppercase tracking-[0.2em] text-neutral-500 underline underline-offset-4 hover:text-brand-crimson"
        }
      >
        Guía de tallas
      </button>

      {hasMounted ? (
      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={() => setIsOpen(false)} className="relative z-[60]">
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
              <Dialog.Panel className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4">
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Cerrar guía de tallas"
                  className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
                <Dialog.Title className="mb-3 text-sm font-medium text-neutral-900">
                  Guía de tallas
                </Dialog.Title>
                <Image
                  src={image.url}
                  alt="Guía de tallas"
                  width={image.width}
                  height={image.height}
                  sizes="(min-width: 640px) 400px, 90vw"
                  className="h-auto w-full rounded-lg"
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
      ) : null}
    </>
  );
}
