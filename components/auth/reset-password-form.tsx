"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "./auth-store";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";

export function ResetPasswordForm() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Falta el enlace de recuperación. Pedí uno nuevo desde{" "}
        <Link href="/cuenta/recuperar-contrasena" className="underline underline-offset-4">
          recuperar contraseña
        </Link>
        .
      </p>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4 text-sm">
        <p className="text-neutral-700 dark:text-neutral-300">
          Tu contraseña se actualizó correctamente.
        </p>
        <Link
          href="/cuenta/iniciar-sesion"
          className="flex w-full items-center justify-center rounded-full bg-black p-3.5 text-sm font-medium tracking-wide text-white transition-opacity duration-200 hover:opacity-90 dark:bg-white dark:text-black"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword(token, password);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/cuenta/iniciar-sesion"), 2000);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-neutral-500">
          Nueva contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 flex w-full items-center justify-center rounded-full bg-black p-3.5 text-sm font-medium tracking-wide text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {isSubmitting ? "Guardando..." : "Restablecer contraseña"}
      </button>
    </form>
  );
}
