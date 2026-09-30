// 03G — sondeo puntual de SOLO LECTURA (12 GET, sin login, sin POST) de filtros y orden del sitio actual.
// Uso: node launch/tools/03g-probe-collection-filters.mjs
// Escribe launch/evidence/03g-collection-filter-probe/*.html + index.json (la evidencia offline que lee
// launch/tools/03g-collection-parity.mjs). Este script es la EXCEPCION online (igual que 03g-crawl-current-site.mjs);
// el script de analisis 03g-collection-parity.mjs es determinista y offline.
// Nota Windows: los nombres de archivo NO deben diferir solo por mayusculas (NTFS no distingue): por eso
// "titlecase-Beige" y "uppercase-BEIGE".
import fs from "node:fs";
import path from "node:path";

const OUT = "C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/launch/evidence/03g-collection-filter-probe";
fs.mkdirSync(OUT, { recursive: true });
const ORIGIN = "https://radaelliswimwear.com";
const probes = [
  ["oasis-talla-S", "/oasis-natural?talla=S"],
  ["oasis-color-titlecase-Beige", "/oasis-natural?color=Beige"],
  ["oasis-color-uppercase-BEIGE", "/oasis-natural?color=BEIGE"],
  ["oasis-precio-menos-50", "/oasis-natural?precio=menos-50"],
  ["oasis-precio-mas-200", "/oasis-natural?precio=mas-200"],
  ["oasis-orden-precio-asc", "/oasis-natural?orden=precio-asc"],
  ["oasis-orden-precio-desc", "/oasis-natural?orden=precio-desc"],
  ["aurora-orden-precio-asc", "/aurora-viva?orden=precio-asc"],
  ["aurora-orden-precio-desc", "/aurora-viva?orden=precio-desc"],
  ["home-sample-1", "/"],
  ["home-sample-2", "/"],
  ["home-sample-3", "/"],
];
const index = [];
for (const [name, p] of probes) {
  const rec = { name, path: p };
  try {
    const res = await fetch(ORIGIN + p, { redirect: "manual", headers: { "user-agent": "RadaelliMigrationAudit/03G (read-only)" } });
    const body = await res.text();
    rec.status = res.status;
    rec.bytes = body.length;
    rec.file = name + ".html";
    fs.writeFileSync(path.join(OUT, rec.file), body);
  } catch (e) {
    rec.error = String((e && e.message) || e);
  }
  index.push(rec);
  console.log(rec.name, rec.status, rec.bytes, rec.error || "");
}
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index, null, 1));
