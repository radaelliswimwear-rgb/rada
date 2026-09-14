"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { verifyEmailAction } from "lib/auth/users-actions";
import { useAuth } from "./auth-store";

type Status = "verifying" | "success" | "error";

export function VerifyEmailPanel() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { refresh } = useAuth();
  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const result = await verifyEmailAction(token);
      if (result.success) {
        await refresh();
        setStatus("success");
      } else {
        setError(result.error);
        setStatus("error");
      }
    })();
    // Solo debe correr una vez por token — no por cada render de refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === "verifying") {
    return (
      <p className="text-center text-sm text-neutral-500">Confirmando tu correo...</p>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col gap-4 text-sm">
        <p className="text-neutral-700 dark:text-neutral-300">
          Tu correo quedó confirmado.
        </p>
        <Link
          href="/cuenta"
          className="flex w-full items-center justify-center rounded-full bg-black p-3.5 text-sm font-medium tracking-wide text-white transition-opacity duration-200 hover:opacity-90 dark:bg-white dark:text-black"
        >
          Ir a Mi cuenta
        </Link>
      </div>
    );
  }

  return (
    <p className="text-sm text-neutral-600 dark:text-neutral-400">
      {error ?? "Falta el enlace de confirmación."} No hace falta para poder
      comprar — podés seguir usando tu cuenta con normalidad desde{" "}
      <Link href="/cuenta" className="underline underline-offset-4">
        Mi cuenta
      </Link>
      .
    </p>
  );
}
