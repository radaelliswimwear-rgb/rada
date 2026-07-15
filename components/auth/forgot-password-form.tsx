"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "./auth-store";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";

export function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await requestPasswordReset(email);
    setIsSubmitting(false);
    setResetUrl(result.resetUrl);
  };

  if (resetUrl) {
    return (
      <div className="flex flex-col gap-4 text-sm">
        <p className="text-neutral-700 dark:text-neutral-300">
          Si existe una cuenta con ese email, vas a recibir instrucciones para
          restablecer tu contraseña.
        </p>
        <div className="rounded-md border border-dashed border-neutral-300 p-4 text-xs text-neutral-500 dark:border-neutral-700">
          <p className="mb-2 font-medium text-neutral-700 dark:text-neutral-300">
            Modo demo (sin servidor de email todavía):
          </p>
          <Link
            href={resetUrl}
            className="break-all text-black underline underline-offset-4 dark:text-white"
          >
            {resetUrl}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-neutral-500">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 flex w-full items-center justify-center rounded-full bg-black p-3.5 text-sm font-medium tracking-wide text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {isSubmitting ? "Enviando..." : "Enviar instrucciones"}
      </button>
      <p className="text-center text-sm text-neutral-500">
        <Link href="/cuenta/iniciar-sesion" className="text-black underline-offset-4 hover:underline dark:text-white">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
