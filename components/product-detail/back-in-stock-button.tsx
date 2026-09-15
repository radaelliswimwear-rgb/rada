"use client";

import { Dialog, Transition } from "@headlessui/react";
import { BellAlertIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Fragment, useState } from "react";
import { useAuth } from "components/auth/auth-store";
import { backInStockRepository } from "lib/back-in-stock/back-in-stock-repository";

type Phase = "idle" | "confirming" | "success" | "already";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20";

const triggerClass =
  "flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 p-4 text-sm font-medium text-neutral-700 transition-colors duration-200 hover:border-brand-crimson hover:text-brand-crimson";

// "Avísame cuando vuelva" (Fase 2, P2) — se muestra en lugar del botón
// "Añadir al carrito" cuando la talla seleccionada está agotada (ver
// product-variant-picker.tsx). Con sesión iniciada nunca pide el correo de
// nuevo (usa auth-store.tsx); sin sesión abre un modal simple. El servidor
// (requestBackInStockAction) es quien de verdad decide "ya estás en la
// lista" — esto es solo la interfaz.
export function BackInStockButton({
  productId,
  size,
}: {
  productId: string;
  size: string;
}) {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (chosenEmail: string) => {
    setIsSubmitting(true);
    setError(null);
    const result = await backInStockRepository.request(productId, size, chosenEmail);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setPhase(result.alreadyRequested ? "already" : "success");
  };

  if (user) {
    if (phase === "success" || phase === "already") {
      return (
        <p className="rounded-lg bg-green-50 px-4 py-3.5 text-center text-sm text-green-800">
          {phase === "success"
            ? "✅ Listo. Te avisaremos cuando vuelva tu talla."
            : "Ya estás en la lista para esta talla."}
        </p>
      );
    }
    if (phase === "confirming") {
      return (
        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="mb-3 text-sm text-neutral-700">
            Te avisaremos a <strong>{user.email}</strong> cuando vuelva la
            talla <strong>{size}</strong>.
          </p>
          {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => submit(user.email)}
              className="rounded-full bg-black px-5 py-2 text-xs font-medium uppercase tracking-wide text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? "Enviando..." : "Avísame"}
            </button>
            <button
              type="button"
              onClick={() => setPhase("idle")}
              className="rounded-full border border-neutral-300 px-5 py-2 text-xs font-medium text-neutral-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      );
    }
    return (
      <button type="button" onClick={() => setPhase("confirming")} className={triggerClass}>
        <BellAlertIcon className="h-4 w-4" />
        Avísame cuando vuelva
      </button>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setModalOpen(true)} className={triggerClass}>
        <BellAlertIcon className="h-4 w-4" />
        Avísame cuando vuelva
      </button>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="relative z-[70]">
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
            <Dialog.Panel className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Cerrar"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors duration-200 hover:bg-neutral-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              {phase === "success" || phase === "already" ? (
                <div className="pt-4 text-center">
                  <p className="text-sm text-neutral-800">
                    {phase === "success"
                      ? "✅ Listo. Te avisaremos cuando vuelva tu talla."
                      : "Ya estás en la lista para esta talla."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="mt-5 rounded-full bg-black px-6 py-2.5 text-xs font-medium uppercase tracking-wide text-white transition-opacity duration-200 hover:opacity-90"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <div>
                  <BellAlertIcon className="h-6 w-6 text-neutral-700" />
                  <Dialog.Title className="mt-2 text-lg font-semibold text-neutral-900">
                    Avísame cuando vuelva
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-neutral-500">
                    Te escribimos apenas la talla {size} esté disponible otra
                    vez.
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Correo electrónico"
                    className={`mt-4 ${inputClass}`}
                  />
                  {error ? (
                    <p className="mt-2 text-xs text-red-600">{error}</p>
                  ) : null}
                  <button
                    type="button"
                    disabled={isSubmitting || !email}
                    onClick={() => submit(email)}
                    className="mt-4 w-full rounded-full bg-black py-3 text-sm font-medium uppercase tracking-wide text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Enviando..." : "Avísame cuando vuelva"}
                  </button>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </>
  );
}
