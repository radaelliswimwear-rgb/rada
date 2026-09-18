import { test } from "node:test";
import assert from "node:assert/strict";

// Fase 2A de analytics, sección 37: con ANALYTICS_RUNTIME_ENABLED="true", la
// CSP SÍ debe permitir los dominios estrictamente necesarios de GA4/Meta --
// en un archivo propio (no lib/security/csp.test.ts) porque next.config.ts
// lee process.env al cargarse, y node:test cachea el módulo por proceso:
// hace falta fijar la variable ANTES del import (mismo motivo por el que
// cada escenario de createOrderAction vive en su propio archivo).
process.env.ANALYTICS_RUNTIME_ENABLED = "true";

test("W: runtime ON -> CSP permite exactamente los dominios de GA4/Meta necesarios", async () => {
  const { default: nextConfig } = await import("../../next.config");
  const headersConfig = await nextConfig.headers?.();
  const entry = headersConfig!.find((item) => item.source === "/:path*");
  const cspHeader = entry!.headers.find(
    (header) => header.key === "Content-Security-Policy",
  );
  assert.ok(cspHeader);

  for (const domain of [
    "https://www.googletagmanager.com",
    "https://connect.facebook.net",
    "https://www.google-analytics.com",
    "https://www.facebook.com",
  ]) {
    assert.ok(
      cspHeader!.value.includes(domain),
      `con el runtime activo, la CSP debe incluir "${domain}"`,
    );
  }

  // Sigue sin permitir dominios que no pedimos -- ni siquiera con el
  // runtime activo se abre la puerta a TikTok u otros trackers no
  // instrumentados en esta fase.
  assert.ok(!cspHeader!.value.includes("tiktok.com"));
  assert.ok(!cspHeader!.value.includes("doubleclick.net"));
});

// Hallazgo live (validación de activación, sep. 2026): fbevents.js cargaba
// (script-src/connect-src/img-src ya permitían lo necesario) pero el
// transporte real del evento a facebook.com/tr quedaba bloqueado por
// form-action (sin caso condicional de analytics) y por frame-src (ni
// siquiera definido, así que caía al fallback de default-src 'self') --
// confirmado con la consola real de Chrome en Production, no supuesto.
test("X: runtime ON -> form-action y frame-src permiten exactamente 'self' + facebook.com, nada más", async () => {
  const { default: nextConfig } = await import("../../next.config");
  const headersConfig = await nextConfig.headers?.();
  const entry = headersConfig!.find((item) => item.source === "/:path*");
  const cspHeader = entry!.headers.find(
    (header) => header.key === "Content-Security-Policy",
  );
  assert.ok(cspHeader);
  const directives = Object.fromEntries(
    cspHeader!.value.split("; ").map((d) => {
      const [name, ...values] = d.split(" ");
      return [name, values];
    }),
  );

  assert.deepEqual(directives["form-action"], ["'self'", "https://www.facebook.com"]);
  assert.deepEqual(directives["frame-src"], ["'self'", "https://www.facebook.com"]);

  // frame-ancestors (quién puede embebernos a NOSOTROS) es una directiva
  // completamente distinta de frame-src (qué podemos embeber nosotros) --
  // nunca debe aflojarse, con o sin analytics activo.
  assert.deepEqual(directives["frame-ancestors"], ["'none'"]);
  assert.deepEqual(directives["object-src"], ["'none'"]);
  assert.deepEqual(directives["base-uri"], ["'self'"]);

  // Sin wildcards amplios en ninguna directiva tocada por analytics.
  for (const key of ["form-action", "frame-src", "script-src", "connect-src", "img-src"]) {
    for (const value of directives[key] ?? []) {
      assert.ok(
        !value.includes("*") && value !== "https:",
        `${key} no debe tener wildcards amplios (encontrado: "${value}")`,
      );
    }
  }
});
