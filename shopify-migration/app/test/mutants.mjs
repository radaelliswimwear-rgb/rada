/**
 * Prueba de mutación (sin dependencias): copia la app a una carpeta
 * temporal, introduce UN error chico por vez en el código (un "mutante") y
 * corre la suite completa. Si la suite falla, el mutante quedó "muerto"
 * (bien: los tests detectan ese error). Si pasa, "sobrevivió" (hueco de
 * cobertura).
 *
 * Uso: node test/mutants.mjs   (desde app/)   o   npm run mutants
 * Carpeta temporal: MUTANTS_TMPDIR (por defecto la del sistema). Se borra al final.
 * Sale con código 1 si la suite base falla, si algún mutante sobrevive o si
 * alguna mutación ya no aplica (el texto buscado no está exactamente 1 vez).
 *
 * No se incluyen mutantes indetectables por diseño (p. ej. comparar la firma
 * sin tiempo constante: el resultado funcional es el mismo).
 */
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

// Si `node --test` levanta este archivo por los patrones por defecto, no hace nada.
if (process.env.NODE_TEST_CONTEXT) process.exit(0);

const APP_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * Qué se copia: toda la app (los tests leen los TOML, el README y la
 * plantilla .env.example) menos dependencias, cachés y cualquier .env real.
 */
function shouldCopy(source) {
  const segments = source.split(/[\\/]/);
  const name = segments.at(-1);
  if (name.startsWith(".env") && name !== ".env.example") return false;
  return !segments.some((segment) => ["node_modules", ".git", ".shopify", "dist"].includes(segment));
}

/** Cada mutante: [archivo, texto exacto (1 sola vez), reemplazo], uno o más cambios. */
const MUTANTS = [
  {
    id: "shop-allowlist-dropped",
    what: "no se valida la tienda contra la allowlist",
    edits: [["server/proxy-signature.mjs", 'if (shop === null || !isAllowedShop(shop, allowedShops)) return fail("shop_not_allowed");', 'if (shop === null) return fail("shop_not_allowed");']],
  },
  {
    id: "timestamp-window-skipped",
    what: "no se valida la ventana de ±300 s",
    edits: [["server/proxy-signature.mjs", 'if (Math.abs(nowSec - Number(timestamp)) > maxSkewSec) return fail("stale_request");', ""]],
  },
  {
    id: "body-customer-id-accepted",
    what: "se acepta customerId del body y se usa como identidad",
    edits: [
      ["server/wishlist-core.mjs", 'const REQUEST_KEYS = new Set(["v", "add", "remove"]);', 'const REQUEST_KEYS = new Set(["v", "add", "remove", "customerId"]);'],
      ["server/handlers.mjs", "customerGid: identity.customerGid,", "customerGid: body.customerId ? `gid://shopify/Customer/${body.customerId}` : identity.customerGid,"],
    ],
  },
  {
    id: "cap-applied-to-whole-list",
    what: "el tope de 100 recorta la lista existente",
    edits: [["server/wishlist-core.mjs", "for (const id of current) {", "for (const id of current.slice(0, LIMITS.NEW_ITEMS_CAP)) {"]],
  },
  {
    id: "guest-before-account",
    what: "la invitada va antes que la cuenta en la unión",
    edits: [["server/wishlist-core.mjs", "const next = [...kept, ...appended];", "const next = [...appended, ...kept];"]],
  },
  {
    id: "idempotency-always-writes",
    what: "se escribe aunque la lista no cambie",
    edits: [["server/wishlist-core.mjs", "const changed = next.length !== current.length || next.some((id, index) => id !== current[index]);", "const changed = true;"]],
  },
  {
    id: "no-cas-retry",
    what: "un solo intento de CAS (sin reintento)",
    edits: [["server/admin-client.mjs", "for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {", "for (let attempt = 1; attempt <= 1; attempt += 1) {"]],
  },
  {
    id: "compare-digest-dropped",
    what: "metafieldsSet sin compareDigest (escritura incondicional)",
    edits: [["server/admin-client.mjs", "        compareDigest,", "        compareDigest: undefined,"]],
  },
  {
    id: "signature-logged",
    what: "se loguea la query firmada (firma + id de clienta)",
    edits: [
      ["server/logger.mjs", '"port",', '"port", "query",'],
      ["server/handlers.mjs", "detail: ctx.detail,", "detail: ctx.detail, query: rawQueryOf(req.url),"],
    ],
  },
  {
    id: "customer-gid-logged",
    what: "el correlativo del log es el GID real de la clienta",
    edits: [["server/handlers.mjs", "ctx.subj = correlate(identity.customerGid);", "ctx.subj = identity.customerGid;"]],
  },
  {
    id: "identity-failure-not-401",
    what: "una falla de identidad del proxy responde 400 (el cliente reintentaría en bucle)",
    edits: [["server/handlers.mjs", "if (!identity.ok) return sendError(res, ctx, 401, identity.reason);", "if (!identity.ok) return sendError(res, ctx, 400, identity.reason);"]],
  },
  {
    id: "cors-on-proxy",
    what: "E1 (mismo origen) responde con Access-Control-Allow-Origin",
    edits: [["server/handlers.mjs", 'ctx.route = "proxy";', 'ctx.route = "proxy"; ctx.cors = true;']],
  },
  {
    id: "body-limit-disabled",
    what: "sin tope de 32 KB para el body",
    edits: [["server/handlers.mjs", "export const MAX_BODY_BYTES = LIMITS.MAX_BODY_BYTES;", "export const MAX_BODY_BYTES = 64 * 1024 * 1024;"]],
  },
  {
    id: "rate-limit-disabled",
    what: "sin rate limit por clienta",
    edits: [["server/handlers.mjs", 'if (!bucket.ok) return sendError(res, ctx, 429, "rate_limited", { "Retry-After": String(bucket.retryAfterSec) });', ""]],
  },
  {
    id: "webhook-hmac-skipped",
    what: "webhooks sin verificar HMAC",
    edits: [["server/handlers.mjs", 'if (!verifyWebhookHmac(raw, req.headers["x-shopify-hmac-sha256"], config.apiSecret)) {', "if (false) {"]],
  },
  {
    id: "jwt-alg-not-checked",
    what: "session token sin chequear alg",
    edits: [["server/session-token.mjs", 'if (header.alg !== "HS256") return fail("bad_alg");', ""]],
  },
  {
    id: "jwt-aud-not-checked",
    what: "session token sin chequear aud",
    edits: [["server/session-token.mjs", 'if (typeof clientId !== "string" || clientId.length === 0 || payload.aud !== clientId) return fail("bad_aud");', ""]],
  },
  {
    id: "extension-foreign-node-accepted",
    what: "la extensión muestra como disponible un nodo que no es el guardado",
    edits: [["extensions/mis-favoritos/src/model.js", 'if (!node || typeof node !== "object" || node.id !== gid) {', 'if (!node || typeof node !== "object") {']],
  },
  {
    id: "transport-csrf-header-missing",
    what: "el transporte no manda el header anti-CSRF",
    edits: [["extensions/wishlist-transport/assets/wishlist-transport.js", '"X-Radaelli-Wishlist": "1",', ""]],
  },
  {
    id: "transport-backslash-host",
    what: "accountPageUrl vuelve a aceptar /\\host (SEC-05, 03E)",
    edits: [["extensions/wishlist-transport/assets/wishlist-transport.js", "/^(https:\\/\\/|\\/(?![\\/\\\\]))/", "/^(https:\\/\\/|\\/(?!\\/))/"]],
  },
];

function runSuite(root) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, ["--test", "test/"], { cwd: root, env, encoding: "utf8", timeout: 180_000 });
  return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

function countOccurrences(text, needle) {
  let count = 0;
  for (let index = text.indexOf(needle); index !== -1; index = text.indexOf(needle, index + needle.length)) count += 1;
  return count;
}

function main() {
  const base = process.env.MUTANTS_TMPDIR || tmpdir();
  if (join(base, "/").startsWith(join(APP_DIR, "/"))) {
    console.log("MUTANTS_TMPDIR no puede estar dentro de app/ (se copiaría a sí misma).");
    return 1;
  }
  const root = mkdtempSync(join(base, "radaelli-mutants-"));
  let exitCode = 0;
  try {
    cpSync(APP_DIR, root, { recursive: true, filter: (source) => source === APP_DIR || shouldCopy(source.slice(APP_DIR.length)) });
    const baseline = runSuite(root);
    if (baseline.status !== 0) {
      console.log("BASELINE FAIL: la suite sin mutar no pasa; no tiene sentido mutar.");
      console.log(baseline.output.split("\n").slice(-40).join("\n"));
      return 1;
    }
    console.log("baseline: suite sin mutar PASA");

    let killed = 0;
    const survivors = [];
    const invalid = [];
    for (const mutant of MUTANTS) {
      const originals = new Map();
      let applicable = true;
      for (const [file, find, replace] of mutant.edits) {
        const path = join(root, file);
        const source = originals.get(path) ?? readFileSync(path, "utf8");
        if (!originals.has(path)) originals.set(path, source);
        const current = readFileSync(path, "utf8");
        if (countOccurrences(current, find) !== 1) {
          applicable = false;
          break;
        }
        writeFileSync(path, current.replace(find, () => replace));
      }
      let verdict;
      if (!applicable) {
        verdict = "INVALID (el texto a mutar no está exactamente 1 vez)";
        invalid.push(mutant.id);
      } else {
        const result = runSuite(root);
        if (result.status !== 0) {
          killed += 1;
          verdict = "killed";
        } else {
          verdict = "SURVIVED";
          survivors.push(mutant.id);
        }
      }
      for (const [path, source] of originals) writeFileSync(path, source);
      console.log(`${verdict.padEnd(10)} ${mutant.id} -- ${mutant.what}`);
    }

    console.log(`MUTANTS killed ${killed}/${MUTANTS.length}`);
    if (survivors.length > 0) console.log(`SURVIVED: ${survivors.join(", ")}`);
    if (invalid.length > 0) console.log(`INVALID: ${invalid.join(", ")}`);
    if (survivors.length > 0 || invalid.length > 0) exitCode = 1;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  return exitCode;
}

process.exitCode = main();
