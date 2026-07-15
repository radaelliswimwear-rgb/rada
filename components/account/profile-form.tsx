"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "components/auth/auth-store";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";

export function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await updateProfile({ name, email });
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    toast("Perfil actualizado.");
  };

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800"
    >
      <div className="mb-4">
        <label htmlFor="name" className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-neutral-500">
          Nombre completo
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-neutral-500">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      {error ? <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-black px-6 py-2.5 text-sm font-medium tracking-wide text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {isSubmitting ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
