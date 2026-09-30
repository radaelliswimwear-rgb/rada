// 03G — rastreo de SOLO LECTURA del sitio custom actual (GET, sin login, sin POST).
// Uso: node launch/tools/03g-crawl-current-site.mjs  (escribe launch/evidence/current-site/*.html + index.json)
import fs from "node:fs";
import path from "node:path";

const MIG = "C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration";
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, "")), "..", "evidence", "current-site");
fs.mkdirSync(OUT, { recursive: true });
const ORIGIN = "https://radaelliswimwear.com";

function parseCsv(text) {
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (c !== "\r") cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const urls = new Map();
const add = (u, src) => {
  if (!u || !u.startsWith("http")) return;
  const k = u.replace(/\/$/, "") || u;
  if (!urls.has(k)) urls.set(k, { url: u, sources: [] });
  urls.get(k).sources.push(src);
};
{
  const rows = parseCsv(fs.readFileSync(path.join(MIG, "seo/current-url-inventory.csv"), "utf8"));
  const h = rows[0];
  const ci = h.indexOf("current_url");
  for (const r of rows.slice(1)) add(r[ci], "current-url-inventory");
}
{
  const rows = parseCsv(fs.readFileSync(path.join(MIG, "catalog/shopify-url-parity.csv"), "utf8"));
  for (const r of rows.slice(1)) add(r[0], "shopify-url-parity");
}
for (const p of ["/robots.txt", "/sitemap.xml", "/carrito", "/cart", "/buscar", "/search", "/favoritos", "/wishlist", "/envios", "/devoluciones", "/garantia", "/privacidad", "/terminos", "/cookies", "/contacto", "/nosotros", "/blog", "/cuenta", "/login", "/registro", "/checkout", "/faq", "/ayuda", "/politica-de-privacidad", "/terminos-y-condiciones", "/politica-de-envios", "/politica-de-devoluciones", "/politica-de-garantia", "/politica-de-cookies"]) add(ORIGIN + p, "extra-probe");

const list = [...urls.values()];
console.log("URLs a rastrear:", list.length);

const slug = (u) => (new URL(u).pathname.replace(/^\/|\/$/g, "") || "home").replace(/[^a-zA-Z0-9._-]+/g, "_");
const results = [];
let idx = 0;
async function worker() {
  while (idx < list.length) {
    const it = list[idx++];
    const rec = { url: it.url, sources: [...new Set(it.sources)] };
    try {
      const t0 = Date.now();
      const res = await fetch(it.url, { redirect: "manual", headers: { "user-agent": "RadaelliMigrationAudit/03G (read-only)" } });
      rec.status = res.status;
      rec.location = res.headers.get("location") || "";
      rec.contentType = res.headers.get("content-type") || "";
      rec.ms = Date.now() - t0;
      if (res.status === 200) {
        const body = await res.text();
        rec.bytes = Buffer.byteLength(body);
        const f = slug(it.url) + (rec.contentType.includes("html") ? ".html" : ".txt");
        fs.writeFileSync(path.join(OUT, f), body);
        rec.file = f;
      }
    } catch (e) {
      rec.error = String(e.message || e);
    }
    results.push(rec);
    await new Promise((r) => setTimeout(r, 120));
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
results.sort((a, b) => a.url.localeCompare(b.url));
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(results, null, 1));
const by = {};
for (const r of results) by[r.status || r.error] = (by[r.status || r.error] || 0) + 1;
console.log("resumen por status:", JSON.stringify(by));
