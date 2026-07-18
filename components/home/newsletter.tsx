"use client";

import { useState } from "react";
import { toast } from "sonner";
import { newsletterRepository } from "lib/newsletter/newsletter-repository";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    const result = await newsletterRepository.subscribe(email);
    setIsSubmitting(false);

    if (!result.success) {
      toast(result.error);
      return;
    }

    setSubmitted(true);
    toast("¡Gracias por suscribirte!", {
      description: "Te avisaremos en cuanto haya novedades.",
    });
    setEmail("");
  };

  return (
    <section className="mx-auto max-w-3xl bg-white px-4 py-24 text-center lg:px-8">
      <p className="text-xs uppercase tracking-[0.3em] text-brand-crimson">
        Newsletter
      </p>
      <h2 className="mt-2 font-semibold tracking-tight text-3xl text-neutral-900 sm:text-4xl">
        Sé el primero en enterarte
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm text-neutral-600">
        Suscríbete y recibe acceso anticipado a nuevas colecciones, eventos
        exclusivos y ofertas para miembros.
      </p>
      <form
        onSubmit={onSubmit}
        className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          aria-label="Correo electrónico"
          className="w-full rounded-full border border-neutral-300 bg-transparent px-5 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-coral/30"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="shrink-0 rounded-full bg-brand-coral px-6 py-3 text-sm font-medium tracking-wide text-white transition-colors duration-300 hover:bg-brand-crimson disabled:opacity-60"
        >
          {isSubmitting ? "Enviando..." : "Suscribirme"}
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
