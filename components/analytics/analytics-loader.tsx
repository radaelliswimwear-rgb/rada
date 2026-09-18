"use client";

import Script from "next/script";

// Fase 2A de analytics (secciones 33/34): componente invisible que inyecta
// gtag.js/fbevents.js SOLO cuando corresponde. `ga4Active`/`metaPixelActive`
// ya vienen resueltos por el servidor (isGA4BrowserActive/isMetaPixelActive,
// lib/analytics/consent-gate.ts -- combinan runtime flag + consentimiento +
// tráfico interno) -- este componente nunca vuelve a decidir nada, solo
// renderiza o no renderiza el <script>. Con ANALYTICS_RUNTIME_ENABLED=false
// (el estado de Production al cerrar esta fase), ambas props siempre llegan
// en false, así que este componente nunca imprime nada al DOM.
//
// Los IDs públicos (NEXT_PUBLIC_*) se leen acá directo -- Next.js los
// inyecta en el bundle de cliente en build time, son seguros de exponer
// (section 33/34: "Puede configurarse en Vercel porque el ID es público").
//
// Fix de race de inicialización (validación live post-activación, sep.
// 2026): el bootstrap de Meta Pixel pasó de strategy="afterInteractive" a
// "beforeInteractive". Causa raíz confirmada: este componente (que inyecta
// el script) es HERMANO de `<main>{children}</main>` en app/layout.tsx,
// pero aparece DESPUÉS en el JSX -- React dispara los efectos de los hijos
// de `<main>` (ej. el useEffect de ProductViewAnalytics/track()) ANTES que
// el propio efecto de este componente, que es lo que hace que next/script
// inyecte y ejecute el <script id="meta-pixel-init"> con
// strategy="afterInteractive". Resultado real: track(view_item) podía
// correr ANTES de que window.fbq existiera siquiera como stub, así que
// dispatchMetaPixelEvent (window.fbq indefinido) descartaba el evento en
// silencio -- nunca llegaba a encolarse, porque el snippet oficial de Meta
// (que SÍ resuelve esto con su propio stub/queue) todavía no se había
// ejecutado. Con strategy="beforeInteractive" Next.js inyecta el script en
// el HTML inicial y lo ejecuta ANTES de cualquier hidratación/efecto de
// componente (documentado explícitamente para este caso de uso) -- así
// window.fbq (el stub oficial, con su propio n.queue) queda definido
// SIEMPRE antes de que cualquier useEffect de la página pueda llamar
// fbq(...), sin necesidad de una cola propia paralela (el patrón oficial ya
// encola las llamadas hechas antes de que fbevents.js termine de cargar).
// GA4 (gtag.js) tiene la misma carrera en teoría, pero queda
// deliberadamente fuera de este fix -- no se toca en este proceso.
export function AnalyticsLoader({
  ga4Active,
  metaPixelActive,
}: {
  ga4Active: boolean;
  metaPixelActive: boolean;
}) {
  const ga4MeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {ga4Active && ga4MeasurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}window.gtag=gtag;gtag('js', new Date());gtag('config', '${ga4MeasurementId}');`}
          </Script>
        </>
      ) : null}
      {metaPixelActive && metaPixelId ? (
        <Script id="meta-pixel-init" strategy="beforeInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}
