// 03G — actualiza en launch/evidence/dev-products.jsonl la miga de pan de las 4 fichas que RC1.8 corrigió.
// La captura original (theme RC1.7, ~17:24) mostraba "Inicio / Destacados / <título>" en 4 fichas de Espuma de Ola.
// Tras el push de RC1.8 se re-midió en vivo la ficha (miga, "Volver a" y JSON-LD BreadcrumbList) y salió
// "Inicio / Espuma de Ola / <título>" en las 4. Este script deja ese dato en la evidencia y marca la fila.
// Uso: node launch/tools/03g-update-evidence-rc18-crumbs.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(here, "..", "evidence", "dev-products.jsonl");
const FIXED = new Set(["bikini-palm-verde-oliva", "bikini-shadow-azul-marino", "enterizo-shadow-palm-azul-marino", "entero-golden-hour"]);
const rows = fs.readFileSync(file, "utf8").trim().split("\n").map((l) => JSON.parse(l));
let changed = 0;
for (const r of rows) {
  if (FIXED.has(r.h) && /\/ Destacados \//.test(r.crumbs)) {
    r.crumbsRC17 = r.crumbs;
    r.crumbs = r.crumbs.replace("/ Destacados /", "/ Espuma de Ola /");
    r.crumbsRecapturedRC18 = "2026-09-29: miga, 'Volver a Espuma de Ola' y JSON-LD BreadcrumbList medidos en vivo tras el push de RC1.8";
    changed++;
  }
}
fs.writeFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
console.log("filas actualizadas:", changed);
