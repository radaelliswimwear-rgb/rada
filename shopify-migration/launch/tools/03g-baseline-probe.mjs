// 03G — GET puntual de SOLO LECTURA al sitio actual, para lo que el rastreo previo no guardo.
// Motivo (evidencia insuficiente): el rastreo 03g-crawl-current-site.mjs no guardo cuerpos 404 y no toco
// (a) los 3 posts del blog listados en el sitemap, (b) /cuenta/iniciar-sesion (destino del icono Cuenta del header),
// (c) la variante en minusculas de /producto/COSTA-ESMERALDA-AZUL, (d) una ruta con barra final.
// Uso: node launch/tools/03g-baseline-probe.mjs   (7 GET, sin login, sin POST; escribe launch/evidence/current-site-probe/)
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ""));
const OUT = path.join(HERE, "..", "evidence", "current-site-probe");
fs.mkdirSync(OUT, { recursive: true });
const ORIGIN = "https://radaelliswimwear.com";

const PATHS = [
  "/cuenta/iniciar-sesion",
  "/blog/novedades-temporada",
  "/blog/materiales-nobles-por-que-importan",
  "/blog/guia-de-capas-para-el-invierno",
  "/carrito",
  "/producto/costa-esmeralda-azul",
  "/oasis-natural/",
];

const results = [];
for (const p of PATHS) {
  const rec = { path: p, url: ORIGIN + p };
  try {
    const res = await fetch(ORIGIN + p, { redirect: "manual", headers: { "user-agent": "RadaelliMigrationAudit/03G (read-only)" } });
    rec.status = res.status;
    rec.location = res.headers.get("location") || "";
    rec.contentType = res.headers.get("content-type") || "";
    const body = await res.text();
    rec.bytes = Buffer.byteLength(body);
    if (body && /html/.test(rec.contentType)) {
      const f = "probe_" + (p.replace(/^\/|\/$/g, "").replace(/[^a-zA-Z0-9._-]+/g, "_") || "root") + ".html";
      fs.writeFileSync(path.join(OUT, f), body);
      rec.file = f;
    }
  } catch (e) {
    rec.error = String(e.message || e);
  }
  results.push(rec);
  await new Promise((r) => setTimeout(r, 300));
}
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(results, null, 1));
for (const r of results) console.log(r.status ?? "ERR", r.contentType || "", r.bytes ?? "", r.location || "", r.path);
