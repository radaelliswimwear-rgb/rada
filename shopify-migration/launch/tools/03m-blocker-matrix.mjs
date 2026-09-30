#!/usr/bin/env node
// 03M — regenera la matriz de bloqueos con las 8 categorías de 03M a partir de la clasificación de 03K más las correcciones de esta fase.
// Sin red, sin reloj: misma entrada -> misma salida.
//
//   node launch/tools/03m-blocker-matrix.mjs            # valida, escribe launch/03M-blocker-classification.json y launch/03M-blocker-matrix.md
//   node launch/tools/03m-blocker-matrix.mjs --check    # valida y comprueba que ambos archivos están al día
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const ORDER = ["DONE", "POST-TRANSFER REQUIRED", "OWNER FACT/DATA", "OWNER DECISION", "OWNER AUTH/OAUTH", "BILLING/PLAN", "FINAL CUTOVER", "OPTIONAL/DEFERRABLE"];
const LEGEND = {
  "DONE": "Hecho y verificado; ya no depende de nadie.",
  "POST-TRANSFER REQUIRED": "Solo se puede hacer o comprobar cuando la tienda ya esté transferida a la dueña y con plan (o cuando Shopify o el proveedor lo habiliten).",
  "OWNER FACT/DATA": "Un dato que solo la dueña conoce (razón social, NIT, dirección legal, pesos, cantidades).",
  "OWNER DECISION": "Una elección de la dueña (sí/no o una de varias opciones).",
  "OWNER AUTH/OAUTH": "Una autorización, ingreso a una cuenta o llave que solo la dueña puede dar.",
  "BILLING/PLAN": "Plan de Shopify, facturación o costos.",
  "FINAL CUTOVER": "Se hace una sola vez el día del corte (publicar, dominio).",
  "OPTIONAL/DEFERRABLE": "No bloquea el lanzamiento; se decide o se hace cuando se pueda.",
};
const MAP = { "FINAL-STORE ONLY": "POST-TRANSFER REQUIRED", "LEGAL DATA": "OWNER FACT/DATA" };
const OWNER_CLASSES = ["OWNER FACT/DATA", "OWNER DECISION", "OWNER AUTH/OAUTH", "BILLING/PLAN", "FINAL CUTOVER"];

// Correcciones de 03M sobre filas de 03K (misma id) y filas nuevas.
const OVERRIDES = {
  A1: { class: "OWNER DECISION", also: ["BILLING/PLAN", "POST-TRANSFER REQUIRED"], state: "HECHO en la tienda de lanzamiento (03M): zona Colombia con ÚNICA tarifa «Envío estándar gratis» desde COP 299.900 (verificado en un checkout real de prueba: pedido de COP 367.840 con envío 0). NO existe tarifa por debajo de 299.900 (no se inventó ningún importe). Cálculo en vivo con mensajería: la opción «Calculado por la empresa de transporte o la app» existe en esta tienda, pero exige la cuenta de Envia.com, peso y medidas de cada prenda (hoy 0,0 kg) y, en producción, que el plan lo permita (sin verificar; no se eligió plan).", owner_ask: "D6: tarifa bajo $299.900 (cálculo en vivo con mensajería o importe fijo), y pesos/medidas de las prendas si es en vivo." },
  B1: { class: "POST-TRANSFER REQUIRED", also: ["OWNER AUTH/OAUTH"], state: "Wompi NO es instalable hoy: no está en la lista de proveedores de pago de la tienda ni en la App Store (búsqueda). No se pidieron ni se tocaron llaves. El checkout de punta a punta SÍ pasó con la pasarela de prueba de Shopify (pedido #1001 pagado, confirmación, correo disparado; ver 03M-checkout-e2e.json).", owner_ask: "Cuando Wompi sea instalable: instalar la integración oficial y escribir ella las llaves de PRUEBA en la pantalla oficial; producción solo con su aprobación." },
  A3: { class: "OWNER AUTH/OAUTH", also: ["POST-TRANSFER REQUIRED"], state: "Search & Discovery: app gratuita de Shopify, llevada hasta su pantalla de permisos (03M). Falta el clic «Instalar» de la dueña (no instalada al cierre salvo que el reporte diga lo contrario). Reseñas públicas recientes reportan búsquedas irregulares en Colombia (dato de terceros, sin verificar).", owner_ask: "Un clic en «Instalar» en la pantalla de permisos de Search & Discovery." },
  "HP-01": { class: "DONE", also: [], state: "Nombre visible cambiado a «Radaelli Swimwear» en la tienda de lanzamiento (API: shop.name). El identificador técnico (slug) no cambia hasta la transferencia.", evidence: "launch/evidence/03M-summary.json" },
  C5: { class: "OPTIONAL/DEFERRABLE", also: ["OWNER DECISION"], state: "Siguen las páginas y colecciones por defecto de Shopify: página «Contact» (en inglés) y colección «Home page». Limpiarlas es trivial; no se borró nada sin OK.", owner_ask: "OK para borrar la página «Contact» por defecto y la colección vacía «Home page»." },
  "VAL-01": { class: "FINAL CUTOVER", also: [], state: "Las mediciones que se corren una sola vez sobre el RC final (barrido de ficha, superficies) se hacen al publicar; el checkout ya se probó en 03M con la pasarela de prueba." },
  B3: { class: "OWNER AUTH/OAUTH", also: ["POST-TRANSFER REQUIRED"], state: "Sin píxeles en la tienda de lanzamiento (Eventos de clientes vacío; verificado en 03M). Plan y runbook de analítica listos.", owner_ask: "ID de medición de GA4, dataset de Meta e instalar las apps oficiales (OAuth) cuando la tienda sea pública." },
  A2: { class: "OWNER AUTH/OAUTH", also: [], state: "Solo aplica al probar cuentas de clienta; el código llega por correo y lo escribe ella." },
};
const NEW_ROWS = [
  { id: "N-01", class: "OWNER AUTH/OAUTH", also: ["POST-TRANSFER REQUIRED"], state: "Envia.com: la app «Envia Shipping and Fulfillment» está INSTALADA (clic de la dueña). No configurada: falta ingresar/crear la cuenta de Envia.com (solo ella), dirección de origen y paquetes; sin cuenta no hay tarifas en vivo. No se compraron etiquetas ni se eligió plan.", owner_ask: "Ingresar o crear su cuenta de Envia.com en la pestaña de la app (y, si quiere etiquetas, cargar saldo).", blocks: "Solo el cálculo en vivo bajo $299.900" },
  { id: "N-02", class: "DONE", also: [], state: "Checkout de punta a punta en la tienda de lanzamiento: carrito COP 367.840 (≥ 299.900), Colombia con departamentos, moneda COP, teléfono obligatorio, envío gratis, pago con la pasarela de prueba de Shopify, página de confirmación, pedido #1001 creado (pagado, no preparado), correo de confirmación disparado, inventario sin seguimiento (no descuenta); pedido archivado sin reembolso ni dinero real.", evidence: "launch/evidence/03M-checkout-e2e.json" },
  { id: "N-03", class: "POST-TRANSFER REQUIRED", also: ["BILLING/PLAN"], state: "Idioma PRINCIPAL sigue en inglés (español publicado y por defecto en el dominio raíz). Cambiarlo aplica traducciones a «Pago y Sistema» y al tema, con efectos materiales sobre RC1.10; se dejó y se documentó para el corte.", owner_ask: "Ninguna: se decide y ejecuta en el corte (runbook P13)." },
  { id: "N-04", class: "DONE", also: [], state: "Checkout: contacto por correo; teléfono de la dirección de envío OBLIGATORIO (guía de Wompi); sin campo de empresa ni NIT inventado; zona horaria, moneda y unidades de Colombia verificadas (paridad 8/8).", evidence: "launch/evidence/03M-summary.json" },
  { id: "N-05", class: "POST-TRANSFER REQUIRED", also: ["BILLING/PLAN"], state: "La pasarela de prueba de Shopify queda activa en la tienda de lanzamiento (las tiendas de desarrollo solo procesan pagos de prueba). Al transferir hay que reemplazarla por un proveedor real; la contraseña de la tienda sigue puesta.", owner_ask: "Ninguna ahora; en el corte se instala el proveedor real (Wompi u otro)." },
  { id: "N-06", class: "OWNER FACT/DATA", also: [], state: "Formulario compacto de datos y decisiones listo (launch/03m/owner-final-data-form.md): razón social, NIT, dirección legal, representante, pesos y medidas, cantidades; NO se le presenta hasta que ella decida empezar.", owner_ask: "Ver el formulario." },
  { id: "N-07", class: "DONE", also: [], state: "Las 4 únicas 404 intencionales: /envios, /terminos, /privacidad, /cookies (redirecciones a páginas que no existen hasta resolver F1-F4 y D2). Control de enlaces 9/9 PASS.", evidence: "launch/evidence/03M-summary.json" },
];

export function build(cls) {
  const items = cls.items.map((it) => {
    const o = OVERRIDES[it.id];
    const base = o ? { ...it, ...o } : { ...it };
    const c = MAP[base.class] || base.class;
    return { ...base, class: c, also: (base.also || []).map((a) => MAP[a] || a).filter((a) => a !== c) };
  });
  return { items: [...items, ...NEW_ROWS.map((r) => ({ ...r }))] };
}

export function validate(cls, exists = (p) => fs.existsSync(path.join(root, p))) {
  const errs = [];
  const seen = new Set();
  for (const it of cls.items) {
    if (seen.has(it.id)) errs.push(`id repetido: ${it.id}`);
    seen.add(it.id);
    if (!ORDER.includes(it.class)) errs.push(`${it.id}: clase inválida (${it.class})`);
    for (const a of it.also || []) if (!ORDER.includes(a) || a === "DONE" || a === it.class) errs.push(`${it.id}: 'also' inválida (${a})`);
    if (!String(it.state || "").trim()) errs.push(`${it.id}: state vacío`);
    if (it.class === "DONE") {
      if (!it.evidence) errs.push(`${it.id}: DONE sin evidencia`);
      else if (!it.evidence.startsWith("git:") && !exists(it.evidence)) errs.push(`${it.id}: la evidencia ${it.evidence} no existe`);
    }
    if (OWNER_CLASSES.includes(it.class) && !String(it.owner_ask || "").trim() && it.class !== "FINAL CUTOVER") errs.push(`${it.id}: clase de la dueña sin owner_ask`);
  }
  return errs;
}

export function render(cls, matrix) {
  const mById = new Map(matrix.items.map((i) => [i.id, i]));
  const counts = Object.fromEntries(ORDER.map((c) => [c, cls.items.filter((i) => i.class === c).map((i) => i.id)]));
  const esc = (t) => String(t || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  const L = [];
  L.push("# 03M — Matriz de bloqueos (8 categorías)");
  L.push("");
  L.push("*Generada por `launch/tools/03m-blocker-matrix.mjs` desde `launch/03K-blocker-classification.json` + las correcciones de 03M (fuente única en la herramienta). No editar a mano.*");
  L.push("");
  L.push("## 1. Resultado");
  L.push("");
  L.push(`- Filas: **${cls.items.length}** (32 de 03I + 7 nuevas de 03M).`);
  L.push("");
  L.push("| Categoría | Filas | Ids |");
  L.push("|---|---:|---|");
  for (const c of ORDER) L.push(`| **${c}** | ${counts[c].length} | ${counts[c].join(", ") || "—"} |`);
  L.push(`| **Total** | **${cls.items.length}** | |`);
  L.push("");
  L.push("Leyenda:");
  L.push("");
  for (const c of ORDER) L.push(`- **${c}**: ${LEGEND[c]}`);
  L.push("");
  L.push("## 2. Detalle por fila");
  L.push("");
  L.push("| Id | Categoría | También | Estado tras 03M | Qué necesita de la dueña |");
  L.push("|---|---|---|---|---|");
  for (const it of cls.items) L.push(`| **${it.id}** | ${it.class} | ${(it.also || []).join(", ") || "—"} | ${esc(it.state)} | ${esc(it.owner_ask) || "—"} |`);
  L.push("");
  return L.join("\n");
}

if (process.argv[1] && process.argv[1].endsWith("03m-blocker-matrix.mjs")) {
  const cls = build(JSON.parse(read("launch/03K-blocker-classification.json")));
  const matrix = JSON.parse(read("launch/03I-blocker-matrix.json"));
  const errs = validate(cls);
  if (errs.length) { console.log("FALLA:\n - " + errs.join("\n - ")); process.exit(1); }
  const md = render(cls, matrix);
  const json = JSON.stringify(cls, null, 2) + "\n";
  const files = [["launch/03M-blocker-matrix.md", md], ["launch/03M-blocker-classification.json", json]];
  for (const [f, body] of files) {
    const p = path.join(root, f);
    if (process.argv.includes("--check")) {
      const cur = fs.existsSync(p) ? fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n") : "";
      if (cur !== body) { console.log(`${f} NO está al día`); process.exit(1); }
    } else fs.writeFileSync(p, body);
  }
  console.log(JSON.stringify({ filas: cls.items.length, porCategoria: Object.fromEntries(ORDER.map((c) => [c, cls.items.filter((i) => i.class === c).length])) }));
}
