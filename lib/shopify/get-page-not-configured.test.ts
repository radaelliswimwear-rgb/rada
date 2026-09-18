import { test } from "node:test";
import assert from "node:assert/strict";

// Regresión (SEO técnico, sep. 2026): getPage() no tenía el mismo guard
// "Shopify no configurado" que sus funciones hermanas en este mismo
// archivo (getCollectionProducts/getCollections/getMenu/getProduct) --
// sin él, cualquier URL de un solo segmento sin ruta estática que
// matchee (app/[page]/page.tsx, el catch-all real) tiraba
// "SHOPIFY_STORE_DOMAIN environment variable is not set" sin capturar,
// y Next.js respondía 500 en vez de un 404 real. Confirmado en vivo en
// producción durante esta auditoría, antes del fix.
//
// `endpoint` se calcula UNA vez al cargar el módulo a partir de
// SHOPIFY_STORE_DOMAIN -- este test corre con el mismo .env.test que ya
// usa el resto de la suite (sin esa variable seteada), que es
// exactamente el escenario real de este proyecto (Shopify nunca
// configurado).
test("getPage(): sin SHOPIFY_STORE_DOMAIN, devuelve undefined en vez de tirar", async () => {
  assert.equal(
    process.env.SHOPIFY_STORE_DOMAIN,
    undefined,
    "precondición: este test asume Shopify no configurado, igual que producción hoy",
  );
  const { getPage } = await import("./index");
  const result = await getPage("cualquier-handle");
  assert.equal(result, undefined);
});
