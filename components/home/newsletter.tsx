"use client";

import { useState } from "react";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center lg:px-8">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
        Newsletter
      </p>
      <h2 className="mt-2 font-semibold tracking-tight text-3xl text-black sm:text-4xl dark:text-white">
        Sé el primero en enterarte
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm text-neutral-600 dark:text-neutral-400">
        Suscríbete y recibe acceso anticipado a nuevas colecciones, eventos
        exclusivos y ofertas para miembros.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email) return;
          setSubmitted(true);
          toast("¡Gracias por suscribirte!", {
            description: "Te avisaremos en cuanto lancemos la tienda.",
          });
          setEmail("");
        }}
        className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          aria-label="Correo electrónico"
          className="w-full rounded-full border border-neutral-300 bg-transparent px-5 py-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-black px-6 py-3 text-sm font-medium tracking-wide text-white transition-transform duration-300 hover:scale-[1.02] dark:bg-white dark:text-black"
        >
          Suscribirme
        </button>
      </form>
      {submitted ? (
        <p className="mt-3 text-xs text-neutral-500">
          Revisa tu bandeja de entrada pronto.
        </p>
      ) : null}
    </section>
  );
}
