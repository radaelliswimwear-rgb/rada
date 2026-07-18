"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "./auth-store";
import { PasswordInput } from "./password-input";

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
      <PasswordInput
        id="password"
        label="Nueva contraseña"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        minLength={8}
      />

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
