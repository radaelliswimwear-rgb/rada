"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { captureAttributionTouchAction } from "lib/attribution/capture-actions";
import { MARKETING_CONSENT_GRANTED_EVENT } from "lib/attribution/events";
import type { ConsentPreferences } from "lib/consent/preferences";

// Fase 1 de analytics: componente invisible (nunca renderiza nada), montado
// una sola vez en app/layout.tsx junto a ConsentBanner. No repite ningún
// parseo de UTM acá -- solo junta las señales crudas del navegador
// (querystring, document.referrer, pathname) y se las pasa tal cual a
// captureAttributionTouchAction, que hace toda la sanitización/decisión
// server-side (lib/attribution/parsing.ts, lib/attribution/state.ts).
//
// Corre UNA vez por carga real de página (efecto con deps vacías -- este
// componente vive en el layout raíz, que no se vuelve a montar en
// navegación interna por <Link>, así que esto nunca se confunde con
// "navegación interna crea un touch nuevo": simplemente nunca vuelve a
// correr para eso). Vuelve a intentarlo, sin recargar, cuando
// ConsentBanner avisa que se acaba de otorgar consentimiento de marketing
// -- en ese momento vuelve a leer la URL actual (sigue siendo la misma
// landing), nunca algo guardado de antes del consentimiento.
export function AttributionCapture({
  initialConsent,
}: {
  initialConsent: ConsentPreferences | null;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (initialConsent?.marketing === true) {
      void captureAttributionTouchAction({
        search: searchParams.toString(),
        referrer: document.referrer || null,
        path: window.location.pathname,
      });
    }
    // Deliberadamente sin dependencias más allá del mount: no debe
    // re-ejecutarse en cada cambio de searchParams por navegación interna,
    // solo una vez por carga real de página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onMarketingGranted() {
      void captureAttributionTouchAction({
        search: window.location.search,
        referrer: document.referrer || null,
        path: window.location.pathname,
      });
    }
    window.addEventListener(MARKETING_CONSENT_GRANTED_EVENT, onMarketingGranted);
    return () =>
      window.removeEventListener(
        MARKETING_CONSENT_GRANTED_EVENT,
        onMarketingGranted,
      );
  }, []);

  return null;
}
