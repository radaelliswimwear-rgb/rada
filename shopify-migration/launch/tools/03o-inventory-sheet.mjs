#!/usr/bin/env node
/**
 * 03O — genera la hoja de inventario completada con las cantidades que dio la dueña (no se inventa nada).
 * Regla de la dueña (2026-09-30):
 *   - colección «Oasis Natural»: S = 2, M = 3, L = 1 por producto;
 *   - todas las demás variantes (Aurora Viva, Espuma de Ola, cualquier otra talla): 1 unidad «de momento» (estándar provisional);
 *   - talla XL de alba-dorada-cafe-claro: CONSERVAR (98/98), 1 unidad.
 *
 *   node launch/tools/03o-inventory-sheet.mjs            # escribe import/inventory-sheet-03o.csv
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gql } from "./03l-migrate.mjs";
import { parseCSV } from "./03k-catalog-package-check.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OASIS = { S: 2, M: 3, L: 1 };

const col = gql(`query { collectionByHandle(handle: "oasis-natural") { products(first: 50) { nodes { handle } } } }`).collectionByHandle;
const oasis = new Set(col.products.nodes.map((p) => p.handle));

const raw = fs.readFileSync(path.join(ROOT, "import/inventory-template.csv"), "utf8").replace(/^﻿/, "");
const [head, ...rows] = parseCSV(raw);
const ix = Object.fromEntries(head.map((h, i) => [h, i]));
const esc = (s) => (/[",\n]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : s);
const out = [head.join(",")];
const stats = { oasis: 0, otras: 0, total: 0, unidades: 0 };
for (const r of rows) {
  if (!r[ix.sku]) continue;
  const h = r[ix.handle];
  const size = r[ix.talla];
  let q, nota;
  if (oasis.has(h) && OASIS[size] !== undefined) { q = OASIS[size]; nota = "Oasis Natural: cantidades de la dueña"; stats.oasis++; }
  else { q = 1; nota = oasis.has(h) ? "Oasis Natural: talla sin cantidad dada, estándar provisional 1" : "Estándar provisional de la dueña: 1 unidad por talla"; stats.otras++; }
  if (r[ix.sku] === "LG-AUR-000001-XL") nota = "XL conservada por decisión de la dueña; estándar provisional 1";
  r[ix.cantidad_a_cargar] = String(q);
  r[ix.nota] = nota;
  stats.total++; stats.unidades += q;
  out.push(r.map(esc).join(","));
}
fs.writeFileSync(path.join(ROOT, "import/inventory-sheet-03o.csv"), "﻿" + out.join("\n") + "\n");
console.log(JSON.stringify({ oasisProductos: oasis.size, ...stats }));
