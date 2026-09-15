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
    // Mismo fondo pastel que PromoBanner (justo arriba en el home, ver
    // app/page.tsx) a propósito: se lee como un solo bloque — "estas son
    // nuestras ofertas de hoy, dejá tu correo y te avisamos de las que
    // vienen" — no como dos secciones sueltas sin relación. No promete un
    // descuento nuevo por suscribirse (el 20% del banner de arriba ya es
    // visible para cualquiera sin dejar el correo, a propósito): esto es
    // para enterarse primero de próximas colecciones y promociones.
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-blush/30 to-white px-4 py-20 text-center lg:px-8">
      <div className="relative z-10 mx-auto max-w-md">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-crimson">
          Ofertas y novedades
        </p>
        <h2 className="mt-2 font-semibold tracking-tight text-3xl text-neutral-900 sm:text-4xl">
          Sé la primera en enterarte
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-neutral-600">
          Dejá tu correo y recibí aviso apenas lancemos nuevas colecciones,
          promociones y ofertas — sin necesidad de crear una cuenta.
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
            className="w-full rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-coral/30"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="shrink-0 rounded-full bg-brand-coral px-6 py-3 text-sm font-medium tracking-wide text-white transition-colors duration-300 hover:bg-brand-crimson disabled:opacity-60"
          >
            {isSubmitting ? "Enviando..." : "Quiero enterarme"}
          </button>
        </form>
        {submitted ? (
          <p className="mt-3 text-xs text-neutral-500">
            Listo — te avisamos apenas haya novedades.
          </p>
        ) : null}
      </div>
    </section>
  );
}
