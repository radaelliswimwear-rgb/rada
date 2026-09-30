#!/usr/bin/env node
// 03N — actualiza la matriz de 03M con los resultados de 03N (Wompi, Search & Discovery, Envia). Mismas 8 categorías.
// Sin red, sin reloj: misma entrada -> misma salida.
//
//   node launch/tools/03n-blocker-matrix.mjs            # valida y escribe launch/03N-blocker-classification.json y launch/03N-blocker-matrix.md
//   node launch/tools/03n-blocker-matrix.mjs --check    # valida y comprueba que ambos archivos están al día
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, validate, render } from "./03m-blocker-matrix.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const ORDER = ["DONE", "POST-TRANSFER REQUIRED", "OWNER FACT/DATA", "OWNER DECISION", "OWNER AUTH/OAUTH", "BILLING/PLAN", "FINAL CUTOVER", "OPTIONAL/DEFERRABLE"];

const OVERRIDES_03N = {
  B1: { class: "DONE", also: [], state: "Wompi (ruta oficial A, proveedor «Wompi Pagos» de Wompi Co) INSTALADO y en MODO PRUEBA en la tienda de lanzamiento: la instalación directa sí funciona en una Client Transfer Store (no era «no disponible»; solo faltaba usar el enlace oficial). Checkout de prueba de punta a punta: pedido #1002, COP 367.840, envío gratis, pagado con el sandbox de Wompi, confirmación y pedido creado (archivado después). Las llaves las escribió la dueña directamente; no se leyeron ni se guardaron. Ruta B («Wompi Tarjetas»): ficha existente y gratuita, no instalada a propósito (Wompi pide configurar primero la tradicional).", evidence: "launch/evidence/03N-wompi-e2e.json" },
  A3: { class: "DONE", also: [], state: "Search & Discovery INSTALADA (clic de la dueña) en la tienda de lanzamiento. Filtros por defecto activos (Disponibilidad y Precio). No se añadieron filtros: el editor embebido no respondió de forma fiable por automatización; es opcional.", evidence: "launch/evidence/03N-wompi-e2e.json" },
  "N-01": { class: "POST-TRANSFER REQUIRED", also: ["BILLING/PLAN", "OWNER AUTH/OAUTH"], state: "Envia: la dueña creó su cuenta (saldo $0) e inició sesión; la app instalada muestra «No encontramos tu tienda» y el botón «Continuar» no avanza. La ayuda oficial de Envia atribuye ese error a que el envío calculado por transportista (CCS) no esté habilitado en Shopify; CCS de terceros exige plan Advanced/Plus, o Grow con cargo adicional o facturación anual (documentación de Shopify). Causa NO confirmada de forma independiente; no se eligió plan ni se pagó nada. Tarifas en vivo antes de transferir: NO comprobadas / bloqueadas por esto.", owner_ask: "Después de transferir y elegir plan: volver a abrir la app de Envia y pulsar «Continuar»; si sigue, contactar a soporte de Envia." },
  "N-08": { class: "OWNER FACT/DATA", also: [], state: "Peso y medidas reales: hoy 0,0 kg en las 98 variantes. Envia y Shopify necesitan peso por producto (o por talla) y un paquete (Shopify ya tiene «1 caja» por defecto, sin medidas verificadas). No se inventó nada; plantilla lista para cuando ella los dé.", owner_ask: "Peso (g) de cada prenda empaquetada y medidas de 1 paquete estándar." },
};
const NEW_03N = [
  { id: "N-08", class: "OWNER FACT/DATA", also: [], state: "", owner_ask: "" },
  { id: "N-09", class: "OWNER FACT/DATA", also: [], state: "URL de eventos de Wompi: sin ella el pago aprobado no crea el pedido en Shopify (se comprobó: dos intentos con Error en el Debugger de Wompi, luego correcto al guardar la URL en Sandbox). Hay que repetir esa URL en PRODUCCIÓN de Wompi antes de cobrar de verdad.", owner_ask: "Pegar la URL de eventos también en el panel de producción de Wompi (Desarrolladores → Programadores)." },
];

export function build03n(base) {
  const items = base.items.map((it) => (OVERRIDES_03N[it.id] ? { ...it, ...OVERRIDES_03N[it.id] } : it));
  for (const n of NEW_03N) if (!items.find((i) => i.id === n.id)) items.push({ ...n, ...(OVERRIDES_03N[n.id] || {}) });
  return { items };
}

if (process.argv[1] && process.argv[1].endsWith("03n-blocker-matrix.mjs")) {
  const cls = build03n(build(JSON.parse(read("launch/03K-blocker-classification.json"))));
  const matrix = JSON.parse(read("launch/03I-blocker-matrix.json"));
  const errs = validate(cls);
  if (errs.length) { console.log("FALLA:\n - " + errs.join("\n - ")); process.exit(1); }
  const md = render(cls, matrix).replace("# 03M — Matriz de bloqueos (8 categorías)", "# 03N — Matriz de bloqueos (8 categorías)").replace("Estado tras 03M", "Estado tras 03N").replace("(32 de 03I + 7 nuevas de 03M)", "(32 de 03I + 9 nuevas de 03M/03N)").replace(/`launch\/tools\/03m-blocker-matrix.mjs`[^.]*\./, "`launch/tools/03n-blocker-matrix.mjs` (sobre `03m-blocker-matrix.mjs`).");
  const json = JSON.stringify(cls, null, 2) + "\n";
  for (const [f, body] of [["launch/03N-blocker-matrix.md", md], ["launch/03N-blocker-classification.json", json]]) {
    const p = path.join(root, f);
    if (process.argv.includes("--check")) {
      const cur = fs.existsSync(p) ? fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n") : "";
      if (cur !== body) { console.log(`${f} NO está al día`); process.exit(1); }
    } else fs.writeFileSync(p, body);
  }
  console.log(JSON.stringify({ filas: cls.items.length, porCategoria: Object.fromEntries(ORDER.map((c) => [c, cls.items.filter((i) => i.class === c).length])) }));
}
