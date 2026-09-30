// 03G — escaneo de secretos / tokens / cookies / claves privadas / PII de clientes.
// Uso: node launch/tools/03g-secret-scan.mjs <ruta|archivo> [<ruta> ...]
// Salida: JSON con hallazgos "BLOCKING" (secretos o PII de clientes) y "ALLOWED" (contacto público de la marca).
// No imprime valores completos: enmascara lo que coincide.
import fs from "node:fs";
import path from "node:path";

const TEXT = /\.(liquid|json|jsonl|js|mjs|cjs|ts|tsx|css|md|txt|csv|html|svg|toml|yml|yaml|xml)$/i;
const SKIP_DIRS = new Set(["node_modules", ".git"]);

const BLOCKING = {
  "token de Shopify (shpat/shpss/shpca/shppa)": /shp(?:at|ss|ca|pa)_[A-Za-z0-9]{8,}/,
  "clave live/test (sk_/pk_/rk_)": /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{8,}/,
  "llave de Wompi (pub_/prv_)": /\b(?:pub|prv)_(?:prod|test|stagtest)_[A-Za-z0-9]{8,}/,
  "clave privada PEM": /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/,
  "JWT": /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  "Bearer con valor": /\bBearer\s+[A-Za-z0-9._~+/-]{20,}/,
  "URL de base de datos con credenciales": /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s:@/]+:[^\s@/]+@/i,
  "asignación de secreto con valor": /\b(?:api[_-]?key|client[_-]?secret|secret[_-]?key|access[_-]?token|refresh[_-]?token|auth[_-]?token|private[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9/_+=.-]{16,}/i,
  "cookie de sesión de Shopify": /\b(?:_shopify_(?:y|s|sa_p|sa_t)|_secure_session_id|_shopify_essential|cart_sig|_bt|storefront_digest)\s*=\s*[A-Za-z0-9%._-]{8,}/,
  "URL de checkout con token": /\/checkouts\/(?:cn|c)\/[A-Za-z0-9_-]{12,}/,
  "parámetro _bt / preview_bt / key= en URL": /[?&](?:_bt|preview_bt|key|token|access_token)=[A-Za-z0-9._-]{12,}/,
  "Cloudinary api_secret": /api_secret\s*[:=]\s*["']?[A-Za-z0-9_-]{16,}/i,
  "OTP / código de ingreso": /\b(?:otp|verification[_ ]code|código de (?:ingreso|verificación))\s*[:=]\s*\d{4,8}\b/i,
};

// Contacto PÚBLICO de la marca (permitido, pero se lista): no es PII de clientas.
const PUBLIC_BRAND = [
  /info@radaelliswimwear\.com/i,
  /radaelliswimwear@gmail\.com/i,
  /wa\.me\/57\d{9,10}/i,
];
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/g;
const PHONE = /(?:\+?57[\s-]?)?\b3\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/g;
const PLACEHOLDER_EMAIL = /@(?:example\.(?:com|org)|test\.com|shopify\.com|myshopify\.com|schema\.org|w3\.org|2x\.png)$/i;
// Marcadores de posición de los formularios (locales) — no son personas.
const PLACEHOLDER_FULL = /^(?:you|tu|tucorreo|correo|nombre|name|user)@(?:email|correo|example)\.(?:com|co)$/i;
// Datos sintéticos de las pruebas del píxel apagado (analytics/custom-pixel/test/*).
const isFixture = (f) => /(?:^|[\\/])(?:analytics[\\/]custom-pixel|app|radaelli-wishlist-app-[0-9.]+)[\\/]test[\\/]/.test(f);

const blocking = [];
const allowed = [];
const fixtures = [];
const files = [];
const walk = (p) => {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const e of fs.readdirSync(p)) if (!SKIP_DIRS.has(e)) walk(path.join(p, e));
  } else if (TEXT.test(p)) files.push(p);
};
for (const a of process.argv.slice(2)) walk(a);

const mask = (s) => (s.length <= 10 ? "***" : s.slice(0, 4) + "…" + s.slice(-2) + ` (${s.length} car.)`);
for (const f of files) {
  let src;
  try { src = fs.readFileSync(f, "utf8"); } catch { continue; }
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    const hit = (rec) => (isFixture(f) ? fixtures : blocking).push(rec);
    for (const [label, re] of Object.entries(BLOCKING)) {
      const m = line.match(re);
      if (m) hit({ file: f, line: i + 1, kind: label, sample: mask(m[0]) });
    }
    for (const m of line.matchAll(EMAIL)) {
      const e = m[0];
      if (PLACEHOLDER_EMAIL.test(e) || PLACEHOLDER_FULL.test(e)) continue;
      if (PUBLIC_BRAND.some((re) => re.test(e))) allowed.push({ file: f, line: i + 1, kind: "correo público de la marca", sample: mask(e) });
      else hit({ file: f, line: i + 1, kind: "correo desconocido (posible PII)", sample: mask(e) });
    }
    if (/wa\.me\/57\d{9,10}/i.test(line)) allowed.push({ file: f, line: i + 1, kind: "enlace wa.me público de la marca", sample: "wa.me/57…" });
    else for (const m of line.matchAll(PHONE)) hit({ file: f, line: i + 1, kind: "teléfono (posible PII)", sample: mask(m[0]) });
  });
}
const summary = {
  filesScanned: files.length,
  blocking: blocking.length,
  allowed: allowed.length,
  syntheticFixtures: fixtures.length,
  blockingByKind: blocking.reduce((a, b) => ((a[b.kind] = (a[b.kind] || 0) + 1), a), {}),
  fixtureFiles: [...new Set(fixtures.map((x) => path.basename(x.file)))],
};
console.log(JSON.stringify({ summary, blocking: blocking.slice(0, 60), allowedByFile: [...new Set(allowed.map((x) => path.relative(process.cwd(), x.file).replace(/\\/g, "/")))] }, null, 1));
process.exitCode = blocking.length ? 1 : 0;
