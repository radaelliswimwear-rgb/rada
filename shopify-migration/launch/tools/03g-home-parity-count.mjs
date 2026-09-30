// 03G — Recuento de clasificaciones de la tabla final de theme/03G-home-parity.md (§ 4).
// Determinista y offline: lee solo ese archivo. Uso: node launch/tools/03g-home-parity-count.mjs
// Comprueba que cada fila tenga exactamente una de las cinco clasificaciones permitidas.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(HERE, "..", "..");
const file = path.join(MIG, "theme", "03G-home-parity.md");
const text = fs.readFileSync(file, "utf8");
const start = text.indexOf("## 4. Tabla final");
const end = text.indexOf("## 5.", start);
if (start < 0 || end < 0) {
  console.error("No se encontró el § 4 en theme/03G-home-parity.md");
  process.exit(1);
}
const ALLOWED = ["matched", "sourced-but-owner-upload-pending", "editorial-pending", "intentionally-hidden", "DIFFERENCE"];
const rows = text
  .slice(start, end)
  .split("\n")
  .filter((l) => /^\| \d+ \| /.test(l))
  .map((l) => l.split("|").map((c) => c.trim()));
const byClass = Object.fromEntries(ALLOWED.map((c) => [c, []]));
const invalid = [];
for (const r of rows) {
  const n = r[1];
  const cls = r[5];
  if (byClass[cls]) byClass[cls].push(n);
  else invalid.push(`${n}: "${cls}"`);
}
console.log(`Filas de la tabla final: ${rows.length}`);
for (const c of ALLOWED) console.log(`${c}: ${byClass[c].length} (filas ${byClass[c].join(", ") || "-"})`);
console.log(`Total clasificado: ${ALLOWED.reduce((s, c) => s + byClass[c].length, 0)}`);
console.log(`Clasificaciones inválidas: ${invalid.length ? invalid.join("; ") : "ninguna"}`);
if (invalid.length) process.exit(2);
