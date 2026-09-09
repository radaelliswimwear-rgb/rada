"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Disclosure } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

// Sección desplegable reutilizable para ocultar contenido secundario
// (descripción larga, envíos, etc.) detrás de un clic — patrón validado
// (Baymard: acordeón vertical vs. tabs horizontales, 8% de contenido
// pasado por alto contra 27%) y el mismo que usan Touché/Reformation/
// Vitamin A en sus fichas de producto. Cada instancia es independiente
// (no hay "solo una abierta a la vez"), así que no necesita un
// componente padre ni contexto compartido.
export function Accordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Disclosure defaultOpen={defaultOpen}>
      {({ open }) => (
        <div className="border-t border-neutral-200 last:border-b">
          <Disclosure.Button className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-neutral-900">
            <span>{title}</span>
            <PlusIcon
              className={clsx(
                "h-4 w-4 flex-none text-neutral-400 transition-transform duration-200",
                open && "rotate-45",
              )}
            />
          </Disclosure.Button>
          <Disclosure.Panel static>
            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pb-4 text-sm leading-relaxed text-neutral-600">
                    {children}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
}
