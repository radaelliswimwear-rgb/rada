"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { activateInternalTrafficAction } from "lib/internal-traffic/activation-actions";

type Status = "activating" | "success" | "error";

export function ActivateInternalTrafficPanel() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(
    token ? "activating" : "error",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const result = await activateInternalTrafficAction(token);
      if (result.success) {
        setStatus("success");
      } else {
        setError(result.error);
        setStatus("error");
      }
    })();
    // Solo debe correr una vez por token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === "activating") {
    return (
      <p className="text-center text-sm text-neutral-500">
        Activando este dispositivo...
      </p>
    );
  }

  if (status === "success") {
    return (
      <p className="text-center text-sm text-neutral-700 dark:text-neutral-300">
        Listo. Este navegador quedó marcado como tráfico interno — las
        futuras métricas de marketing no van a contar lo que hagas acá.
      </p>
    );
  }

  return (
    <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
      {error ?? "Falta el enlace de activación."}
    </p>
  );
}
