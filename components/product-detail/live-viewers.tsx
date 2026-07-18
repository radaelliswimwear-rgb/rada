"use client";

import { EyeIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import {
  getActiveViewersAction,
  pingProductPresenceAction,
} from "lib/catalog/presence-actions";

const HEARTBEAT_MS = 20_000;
const SESSION_KEY = "lago-viewer-session";

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// "N personas viendo esto ahora" (Sprint 19): manda un latido real cada
// 20s mientras la ficha está abierta y muestra el conteo activo — si sólo
// hay una persona (uno mismo), el backend ya devuelve 5 en vez de 1 (regla
// de negocio explícita, ver lib/catalog/presence-actions.ts). No se
// renderiza nada hasta tener el primer conteo real, para no mostrar un
// número que después cambia de golpe.
export function LiveViewers({ productId }: { productId: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sessionId = getSessionId();
    let cancelled = false;

    const ping = () => {
      void pingProductPresenceAction(productId, sessionId);
      getActiveViewersAction(productId).then((value) => {
        if (!cancelled) setCount(value);
      });
    };

    ping();
    const interval = setInterval(ping, HEARTBEAT_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [productId]);

  if (!count) return null;

  return (
    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
      <EyeIcon className="h-3.5 w-3.5" aria-hidden="true" />
      {count} {count === 1 ? "persona está viendo" : "personas están viendo"}{" "}
      esto en este momento
    </span>
  );
}
