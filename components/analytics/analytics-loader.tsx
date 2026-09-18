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
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}
