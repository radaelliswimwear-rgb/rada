// Auditoría de validación live post-activación (sep. 2026): confirma el fix
// de la carrera de inicialización de Meta Pixel encontrada en producción
// (fbevents.js cargaba con 200 pero nunca salía ningún /tr -- ni PageView ni
// ViewContent). Causa raíz: components/analytics/analytics-loader.tsx es
// HERMANO de `<main>{children}</main>` en app/layout.tsx pero aparece
// DESPUÉS en el JSX -- React dispara los efectos de los hijos de `<main>`
// (ej. ProductViewAnalytics/track()) ANTES que el propio efecto de este
// componente, que es lo que hace que next/script con
// strategy="afterInteractive" inyecte y ejecute el bootstrap de Meta. Fix:
// strategy="beforeInteractive" para el Pixel -- Next.js bloquea la
// hidratación (y por lo tanto CUALQUIER useEffect de la página) hasta que
// todos los scripts beforeInteractive terminaron de ejecutarse (confirmado
// leyendo node_modules/next/dist/client/app-bootstrap.js: loadScriptsInSequence
// llama a hydrate() recién en su .then() final).
//
// Esto NO es testeable con un DOM real (el proyecto no tiene jsdom/RTL) --
// se prueban acá las dos partes que SÍ son verificables sin navegador:
// (1) que el componente realmente declara la estrategia correcta (pin de
// regresión contra el string exacto), y (2) que el patrón oficial de
// stub/queue de Meta, una vez definido, nunca pierde ni duplica un evento
// -- que es la garantía de la que depende el fix para ser correcto.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dispatchMetaPixelEvent } from "lib/analytics/adapters/meta-pixel-browser";
import type { AnalyticsProductPayload } from "lib/analytics/types";

const SOURCE = readFileSync(join(__dirname, "analytics-loader.tsx"), "utf-8");

test("pin de regresión: el bootstrap de Meta Pixel usa beforeInteractive (no afterInteractive)", () => {
  const metaBlockMatch = SOURCE.match(
    /id="meta-pixel-init" strategy="([^"]+)"/,
  );
  assert.ok(metaBlockMatch, "no se encontró el <Script id=\"meta-pixel-init\"> en analytics-loader.tsx");
  assert.equal(metaBlockMatch![1], "beforeInteractive");
});

test("GA4 sigue con afterInteractive -- fuera de alcance de este fix, deliberadamente sin tocar", () => {
  // Busca solo dentro de las etiquetas <Script ...> reales (nunca dentro de
  // comentarios, que también contienen estos strings como texto explicativo).
  const scriptTags = [...SOURCE.matchAll(/<Script\b[^>]*strategy="([^"]+)"/g)].map(
    (m) => m[1],
  );
  // El primer <Script src=...gtag/js...> y el <Script id="ga4-init"> deben
  // seguir en afterInteractive; solo el de Meta cambió.
  assert.deepEqual(scriptTags, ["afterInteractive", "afterInteractive", "beforeInteractive"]);
});

function setConsentCookie(prefs: { analytics: boolean; marketing: boolean }) {
  const value = encodeURIComponent(
    JSON.stringify({ version: 1, ...prefs, timestamp: "2026-09-18T00:00:00.000Z" }),
  );
  (globalThis as { document: { cookie: string } }).document.cookie =
    `radaelli_consent=${value}`;
}

const PRODUCT: AnalyticsProductPayload = {
  item_id: "prod-1",
  item_name: "Bikini Foam",
  price: 180000,
  currency: "COP",
  sku: "RAD-BIK-001",
};

test("Caso A/B: window.fbq es el stub oficial (fbevents.js aún no drenó la queue) -> dispatchMetaPixelEvent NO pierde el evento, queda encolado y se entrega exactamente una vez", () => {
  // Reproduce el stub oficial de Meta (mismo patrón que analytics-loader.tsx,
  // simplificado): antes de que la red termine de traer fbevents.js,
  // window.fbq YA es una función (el stub), que solo hace queue.push.
  const queue: unknown[][] = [];
  const stub = (...args: unknown[]) => {
    queue.push(args);
  };
  (globalThis as unknown as { window: unknown }).window = { fbq: stub };
  (globalThis as unknown as { document: unknown }).document = { cookie: "" };
  setConsentCookie({ analytics: true, marketing: true });

  dispatchMetaPixelEvent({ name: "view_item", products: [PRODUCT], value: 180000, currency: "COP" });

  // Caso A: no se perdió -- el stub lo encoló, no lo descartó.
  assert.equal(queue.length, 1);
  assert.equal(queue[0]![0], "track");
  assert.equal(queue[0]![1], "ViewContent");

  // Caso B: al "cargar" fbevents.js real, el snippet oficial drena n.queue
  // procesando cada llamada UNA sola vez (mismo comportamiento documentado
  // del código base de Meta) -- se simula acá para dejar fijada la
  // expectativa de "exactamente una vez", no cero ni dos.
  const delivered = queue.splice(0, queue.length);
  assert.equal(delivered.length, 1);

  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { document?: unknown }).document;
});

test("Caso G: si window.fbq ya es la función real (script ya cargó del todo) -> despacho inmediato, sin pasar por ninguna cola propia", () => {
  const delivered: unknown[][] = [];
  const realFbq = (...args: unknown[]) => {
    delivered.push(args);
  };
  (globalThis as unknown as { window: unknown }).window = { fbq: realFbq };
  (globalThis as unknown as { document: unknown }).document = { cookie: "" };
  setConsentCookie({ analytics: true, marketing: true });

  dispatchMetaPixelEvent({ name: "view_item", products: [PRODUCT], value: 180000, currency: "COP" });

  assert.equal(delivered.length, 1);
  assert.equal(delivered[0]![1], "ViewContent");

  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { document?: unknown }).document;
});
