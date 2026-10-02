// 03Q — aplica la identidad del vendedor (Colombia) en la tienda oficial a partir de un JSON LOCAL que NO se commitea.
// Uso:
//   node apply-seller-identity.mjs <seller.json> --dry            -> valida, renderiza a ./seller-preview/*.html (local), imprime solo longitudes/hash
//   node apply-seller-identity.mjs <seller.json> --apply          -> shopPolicyUpdate CONTACT_INFORMATION + LEGAL_NOTICE y lectura de vuelta
//   node apply-seller-identity.mjs <seller.json> --apply --page-contact   -> además llena /pages/contact (título "Contacto")
// Reglas: NO inventa datos; falla si falta un campo requerido; no deja marcadores [..] sin resolver; escapa HTML;
//         no imprime datos personales en consola (solo claves, longitudes y SHA-256); solo escribe con --apply.
// Plantillas: laneK/legal-identity-audit.md §6.1-6.2 (sujetas a revisión legal por la dueña/asesor).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const STORE = process.env.TARGET_STORE || "wgcvpd-ib.myshopify.com";
const ARGS = process.argv.slice(2);
const FILE = ARGS.find((a) => !a.startsWith("--"));
const APPLY = ARGS.includes("--apply");
const DRY = ARGS.includes("--dry") || !APPLY;
const PAGE = ARGS.includes("--page-contact");
if (!FILE) { console.error("uso: node apply-seller-identity.mjs <seller.json> [--dry|--apply] [--page-contact]"); process.exit(2); }

const S = JSON.parse(fs.readFileSync(FILE, "utf8"));
// Mínimo legal publicable (ChatGPT/SIC art. 50 Ley 1480, 2026-10-02): nombre/razón social, NIT, dirección de notificación judicial, teléfono/WhatsApp, correo.
// ciudad_domicilio y canal_pqr son opcionales: si no se entregan, el canal PQR = el correo público entregado (no se inventa ningún plazo).
const REQ = ["razon_social", "nit", "direccion_legal", "telefono_publico", "correo_publico"];
const missing = REQ.filter((k) => !String(S[k] ?? "").trim());
if (missing.length) { console.error("FALTAN campos requeridos (no se inventan): " + missing.join(", ")); process.exit(3); }

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const has = (k) => String(S[k] ?? "").trim() !== "";
const v = (k) => esc(String(S[k]).trim());
if (!has("canal_pqr")) S.canal_pqr = S.correo_publico;
// Si el nombre aprobado es solo la marca, no se redacta «marca comercial de <la misma marca>» ni se infiere otra identidad legal.
const brandOnly = /^radaelli swimwear$/i.test(String(S.razon_social).trim());
const telDigits = String(S.telefono_publico).replace(/\D/g, "");
const waD = String(S.whatsapp_comercial || "573135359668").replace(/\D/g, "");
const samePhone = waD === telDigits || waD === "57" + telDigits;
const city = has("ciudad_domicilio") ? `${v("ciudad_domicilio")}, ` : "";
const waDigits = String(S.whatsapp_comercial || "573135359668").replace(/\D/g, "");
const waShown = S.whatsapp_comercial ? esc(S.whatsapp_comercial) : "+57 313 535 9668";

const contactBody = [
  `<h2>Quiénes te atienden</h2>`,
  brandOnly
    ? `<p><strong>Radaelli Swimwear</strong>, ${has("tipo_vendedor") && /natural/i.test(S.tipo_vendedor) ? "identificación" : "NIT"} <strong>${v("nit")}</strong>.</p>`
    : `<p><strong>Radaelli Swimwear</strong> es la marca comercial de <strong>${v("razon_social")}</strong>, ${has("tipo_vendedor") && /natural/i.test(S.tipo_vendedor) ? "identificación" : "NIT"} <strong>${v("nit")}</strong>.</p>`,
  `<h2>Cómo contactarnos</h2>`,
  `<ul>`,
  `  <li>Dirección de notificaciones: ${v("direccion_legal")}, ${city}Colombia.</li>`,
  samePhone
    ? `  <li>Teléfono y WhatsApp: <a href="https://wa.me/${waDigits}" target="_blank" rel="noopener noreferrer">${v("telefono_publico")}</a></li>`
    : `  <li>Teléfono: ${v("telefono_publico")}</li>\n  <li>WhatsApp: <a href="https://wa.me/${waDigits}" target="_blank" rel="noopener noreferrer">${waShown}</a></li>`,
  `  <li>Correo electrónico: <a href="mailto:${v("correo_publico")}">${v("correo_publico")}</a></li>`,
  has("horario_atencion") ? `  <li>Horario de atención: ${v("horario_atencion")}</li>` : "",
  `</ul>`,
  `<h2>Peticiones, quejas y reclamos</h2>`,
  `<p>Escríbenos a ${v("canal_pqr")} indicando tu nombre, número de pedido y el motivo.${has("plazo_respuesta") ? ` Te responderemos en ${v("plazo_respuesta")}.` : ""}</p>`,
].filter(Boolean).join("\n");

const legalBody = [
  `<h2>Titular del sitio y vendedor</h2>`,
  `<p>${v("razon_social")}${has("representante_legal") ? `, representada legalmente por ${v("representante_legal")}` : ""}, ${has("tipo_vendedor") && /natural/i.test(S.tipo_vendedor) ? "identificación" : "NIT"} ${v("nit")}, ${has("ciudad_domicilio") ? `con domicilio en ${v("ciudad_domicilio")}, Colombia, y ` : ""}dirección de notificaciones en ${v("direccion_legal")}.${brandOnly ? "" : " Opera bajo la marca <strong>Radaelli Swimwear</strong>."}</p>`,
  has("matricula_mercantil") ? `<p>Matrícula mercantil No. ${v("matricula_mercantil")}${has("camara") ? `, Cámara de Comercio de ${v("camara")}` : ""}.${has("regimen_tributario_texto") ? " " + v("regimen_tributario_texto") : ""}</p>` : (has("regimen_tributario_texto") ? `<p>${v("regimen_tributario_texto")}</p>` : ""),
  `<h2>Contacto</h2>`,
  `<p>${samePhone ? `Teléfono y WhatsApp ${v("telefono_publico")}` : `Teléfono ${v("telefono_publico")} · WhatsApp ${waShown}`} · Correo ${v("correo_publico")}. Más datos en nuestra <a href="/policies/contact-information">Información de contacto</a>.</p>`,
  `<h2>Precios y moneda</h2>`,
  `<p>Los precios se expresan en pesos colombianos (COP).${has("texto_iva") ? " " + v("texto_iva") : ""}</p>`,
  has("texto_sic") ? `<h2>Protección al consumidor</h2>\n<p>${v("texto_sic")}</p>` : "",
  `<h2>Protección de datos personales</h2>`,
  `<p>El responsable del tratamiento de tus datos es ${v("razon_social")}${has("responsable_datos") || has("correo_datos") ? ` (${[has("responsable_datos") ? v("responsable_datos") : "", has("correo_datos") ? v("correo_datos") : ""].filter(Boolean).join(", ")})` : ""}. Consulta nuestra <a href="/pages/privacidad">Política de privacidad</a>.</p>`,
  has("jurisdiccion_texto") ? `<h2>Ley aplicable y jurisdicción</h2>\n<p>${v("jurisdiccion_texto")}</p>` : "",
  has("fecha_publicacion_politicas") ? `<p>Última actualización: ${v("fecha_publicacion_politicas")}</p>` : "",
].filter(Boolean).join("\n");

for (const [n, b] of [["contact", contactBody], ["legal", legalBody]]) {
  if (/\[[^\]]{2,}\]/.test(b.replace(/<[^>]+>/g, " "))) { console.error(`marcador [..] sin resolver en ${n}; no se aplica`); process.exit(4); }
}
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
const outDir = path.join(path.dirname(path.resolve(FILE)), "seller-preview");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "contact-information.html"), contactBody);
fs.writeFileSync(path.join(outDir, "legal-notice.html"), legalBody);
console.log(JSON.stringify({ mode: APPLY ? "apply" : "dry", store: STORE, contact: { len: contactBody.length, sha: sha(contactBody) }, legal: { len: legalBody.length, sha: sha(legalBody) }, previewDir: outDir, fieldsProvided: Object.keys(S).filter((k) => has(k)) }));
if (!APPLY) process.exit(0);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "seller-"));
let seq = 0;
function gql(query, variables = {}, mutation = false) {
  const n = ++seq;
  const qf = path.join(TMP, `q${n}.graphql`), vf = path.join(TMP, `v${n}.json`);
  fs.writeFileSync(qf, query); fs.writeFileSync(vf, JSON.stringify(variables));
  const args = ["store", "execute", "--store", STORE, "--query-file", qf, "--variable-file", vf, "--json", "--no-color"];
  if (mutation) args.push("--allow-mutations");
  const r = spawnSync("shopify.cmd", args, { encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, "");
  const i = out.indexOf("{");
  if (r.status !== 0 || i < 0) throw new Error(`gql #${n} falló (exit ${r.status}): ${((r.stderr || "") + out).slice(0, 600)}`);
  return JSON.parse(out.slice(i));
}
const errs = (label, p) => (p?.userErrors || []).map((e) => `${label}: ${(e.field || []).join(".")} ${e.message}`);
const M = `mutation($p: ShopPolicyInput!) { shopPolicyUpdate(shopPolicy: $p) { shopPolicy { type url } userErrors { field message } } }`;
const results = [];
for (const [type, body] of [["CONTACT_INFORMATION", contactBody], ["LEGAL_NOTICE", legalBody]]) {
  const r = gql(M, { p: { type, body } }, true);
  results.push({ type, ok: !!r.shopPolicyUpdate?.shopPolicy, url: r.shopPolicyUpdate?.shopPolicy?.url || null, errors: errs(type, r.shopPolicyUpdate) });
}
console.log(JSON.stringify({ applied: results }));
if (PAGE) {
  const q = gql(`query { pages(first: 5, query: "handle:contact") { nodes { id title handle isPublished bodySummary } } }`);
  const pg = q.pages?.nodes?.[0];
  if (!pg) console.log(JSON.stringify({ page: "contact no encontrada (crear manualmente o omitir)" }));
  else {
    const r = gql(`mutation($id: ID!, $p: PageUpdateInput!) { pageUpdate(id: $id, page: $p) { page { id handle } userErrors { field message } } }`, { id: pg.id, p: { title: "Contacto", body: contactBody, isPublished: true } }, true);
    console.log(JSON.stringify({ page: { ok: !!r.pageUpdate?.page, errors: errs("page", r.pageUpdate) } }));
  }
}
const rb = gql(`query { shop { shopPolicies { type url body } } }`);
const pol = (rb.shop?.shopPolicies || []).filter((p) => ["CONTACT_INFORMATION", "LEGAL_NOTICE"].includes(p.type)).map((p) => ({ type: p.type, url: p.url, len: (p.body || "").length, sha: sha(p.body || "") }));
console.log(JSON.stringify({ readBack: pol, expected: { contact: sha(contactBody), legal: sha(legalBody) } }));
