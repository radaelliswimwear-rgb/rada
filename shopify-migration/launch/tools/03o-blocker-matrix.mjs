#!/usr/bin/env node
// 03O — matriz de bloqueos tras el cierre de datos previos a la transferencia (mismas 8 categorías; sobre 03N).
// Sin red, sin reloj: misma entrada -> misma salida.
//
//   node launch/tools/03o-blocker-matrix.mjs            # escribe launch/03O-blocker-classification.json y launch/03O-blocker-matrix.md
//   node launch/tools/03o-blocker-matrix.mjs --check
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, validate, render } from "./03m-blocker-matrix.mjs";
import { build03n } from "./03n-blocker-matrix.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const ORDER = ["DONE", "POST-TRANSFER REQUIRED", "OWNER FACT/DATA", "OWNER DECISION", "OWNER AUTH/OAUTH", "BILLING/PLAN", "FINAL CUTOVER", "OPTIONAL/DEFERRABLE"];
const EV = "launch/evidence/03O-summary.json";

const OVERRIDES_03O = {
  D1: { class: "DONE", also: [], state: "Talla XL de alba-dorada-cafe-claro: CONSERVAR (decisión de la dueña, 2026-09-30). Catálogo 98/98 variantes; parity 8/8.", evidence: EV, owner_ask: "" },
  D2: { class: "DONE", also: [], state: "Inventario cargado con seguimiento en las 98 variantes y 128 unidades (Oasis Natural S2/M3/L1 por producto; resto 1 por talla como estándar provisional de la dueña). Verificado 98/98 contra la hoja aprobada.", evidence: EV, owner_ask: "" },
  B2: { class: "DONE", also: [], state: "Los 4 textos legales (Privacidad, Términos, Envíos, Cookies) APROBADOS COMO ESTÁN por la dueña y publicados en la tienda privada; 0 redirecciones legales en 404; menú Ayuda con 6 ítems. No se publicó razón social, NIT ni dirección (no dados; el texto no los exige). La política de privacidad de Shopify (plantilla en inglés) fue reemplazada por el texto aprobado.", evidence: EV, owner_ask: "" },
  C4: { class: "OPTIONAL/DEFERRABLE", also: [], state: "Decisión C de la dueña: dejar el aspecto igual que el sitio original. Sin cambio visual; riesgo de accesibilidad (1,69:1) aceptado y registrado. El parche de la opción A sigue preparado por si cambia de opinión.", owner_ask: "" },
  D3: { class: "POST-TRANSFER REQUIRED", also: ["OWNER AUTH/OAUTH"], state: "Decisión de la dueña: MIGRAR todo. No ejecutado: el origen es la base del sitio anterior (Producción), que este proyecto no toca; hace falta una exportación autorizada. Recomendación: pedidos históricos como archivo de consulta, no como pedidos de Shopify. Procedimiento listo en launch/03o/historical-data-procedure.md.", owner_ask: "Autorizar por escrito la exportación de clientas, cupones, suscriptoras y blog (y confirmar que los pedidos queden como archivo de consulta)." },
  "N-01": { class: "POST-TRANSFER REQUIRED", also: ["BILLING/PLAN"], state: "Envia PRECONFIGURADA: la tienda aparece como «Tienda ya instalada» en la cuenta de Envia, paquete 15×10×5 cm cargado, peso 500 g en las 98 variantes. Las tarifas en vivo bajo COP 299.900 siguen sin aparecer («El envío no está disponible»); se atribuye al envío calculado por transportista (plan), sin confirmar. Se activa y prueba tras transferir y elegir plan (runbook 03P).", owner_ask: "Ninguna antes de transferir; al elegir plan, elegir uno que admita envío calculado por transportista de terceros." },
  A1: { class: "POST-TRANSFER REQUIRED", also: ["BILLING/PLAN"], state: "Regla de la dueña ya decidida: subtotal ≥ COP 299.900 = envío gratis (PASS); por debajo, el cliente paga el envío REAL calculado (no una tarifa fija). Peso 500 g en las 98 variantes y paquete 15×10×5 cm cargados; la app de Envia está vinculada pero la tarifa en vivo aún no aparece (plan/CCS). Hoy un pedido bajo COP 299.900 no tiene método de envío. Se resuelve tras transferir y elegir un plan que admita CCS de terceros.", owner_ask: "Al elegir plan: uno que admita envío calculado por transportista de terceros (ver runbook 03P)." },
  "N-08": { class: "DONE", also: [], state: "Peso de envío: 500 g en las 98 variantes (un peso estándar elegido por la dueña); paquete estándar 15×10×5 cm provisional (ella medirá el exacto). Sin valores inventados.", evidence: EV, owner_ask: "" },
  "N-09": { class: "DONE", also: [], state: "URL de eventos de Wompi guardada en PRODUCCIÓN: confirmado por la dueña («guardada»); Claude no la pudo verificar porque esa pantalla muestra llaves. Wompi sigue en modo prueba.", evidence: EV, owner_ask: "" },
  "N-06": { class: "DONE", also: [], state: "El lote de datos y decisiones previos a la transferencia fue respondido por la dueña y aplicado en 03O (legales, inventario, XL, datos históricos, contraste, peso, paquete, URL de eventos).", evidence: EV, owner_ask: "" },
};

export function build03o(base) {
  return { items: base.items.map((it) => (OVERRIDES_03O[it.id] ? { ...it, ...OVERRIDES_03O[it.id] } : it)) };
}

if (process.argv[1] && process.argv[1].endsWith("03o-blocker-matrix.mjs")) {
  const cls = build03o(build03n(build(JSON.parse(read("launch/03K-blocker-classification.json")))));
  const matrix = JSON.parse(read("launch/03I-blocker-matrix.json"));
  const errs = validate(cls);
  if (errs.length) { console.log("FALLA:\n - " + errs.join("\n - ")); process.exit(1); }
  const md = render(cls, matrix).replace("# 03M — Matriz de bloqueos (8 categorías)", "# 03O — Matriz de bloqueos (8 categorías)").replace("Estado tras 03M", "Estado tras 03O").replace("(32 de 03I + 7 nuevas de 03M)", "(32 de 03I + 9 nuevas de 03M/03N)").replace(/`launch\/tools\/03m-blocker-matrix.mjs`[^.]*\./, "`launch/tools/03o-blocker-matrix.mjs` (sobre 03m y 03n).");
  const json = JSON.stringify(cls, null, 2) + "\n";
  for (const [f, body] of [["launch/03O-blocker-matrix.md", md], ["launch/03O-blocker-classification.json", json]]) {
    const p = path.join(root, f);
    if (process.argv.includes("--check")) {
      const cur = fs.existsSync(p) ? fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n") : "";
      if (cur !== body) { console.log(`${f} NO está al día`); process.exit(1); }
    } else fs.writeFileSync(p, body);
  }
  console.log(JSON.stringify({ filas: cls.items.length, porCategoria: Object.fromEntries(ORDER.map((c) => [c, cls.items.filter((i) => i.class === c).length])) }));
}
