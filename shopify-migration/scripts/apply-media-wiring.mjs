#!/usr/bin/env node
/**
 * Fase 03E/03F -- conecta la media ya subida a Shopify > Contenido > Archivos con
 * el theme Radaelli (theme-src) y lista los metafields de colección a cargar.
 *
 * Entrada: un mapa JSON con las referencias de Shopify que la dueña copia
 * DESPUÉS de subir los archivos (ver content/media/03F-media-owner-runbook.md):
 *
 *   { "refs": { "M01": "shopify://files/videos/…", "M03": "shopify://shop_images/…", …,
 *               "M10": "<nombre en Archivos o gid://shopify/MediaImage/…>" } }
 *
 * Garantías (todo o nada):
 *   - DRY-RUN por defecto: solo con --write se escribe algo.
 *   - Antes de escribir valida: archivos requeridos presentes; schemas y manifiesto;
 *     el mapa cubre TODOS los ids requeridos (M07 es opcional); sin ids duplicados
 *     (JSON con la misma clave dos veces) ni referencias repetidas entre ids (salvo
 *     M01/M06, el mismo video); formato de cada referencia; y, si existe el
 *     manifiesto 03E-upload-ready-manifest.csv, que cada referencia apunte al archivo
 *     preparado de SU id. Cualquier error => no se escribe NADA.
 *   - --write: (1) copia los originales a un directorio con marca de tiempo y
 *     verifica la copia (SNAPSHOT.json con SHA-256), (2) escribe todos los archivos
 *     a temporales y los verifica, (3) renombra todos; si algo falla, revierte solo
 *     desde el snapshot. Al final imprime el comando de restauración.
 *   - --restore=<snapshot> devuelve los archivos originales (también en seco por
 *     defecto; --write aplica).
 *
 * Qué toca: SOLO templates/index.json y templates/product.json de theme-src; lee los
 * schemas de sections/hero.liquid, featured-categories.liquid y main-product.liquid.
 * No usa red, ni Shopify CLI, ni git. No toca settings_data.json.
 *
 * Uso (Node >= 20, sin dependencias):
 *   node shopify-migration/scripts/apply-media-wiring.mjs --map=<mapa.json>              (= --dry-run)
 *   node shopify-migration/scripts/apply-media-wiring.mjs --map=<mapa.json> --write
 *   node shopify-migration/scripts/apply-media-wiring.mjs --restore=<snapshot>           (en seco)
 *   node shopify-migration/scripts/apply-media-wiring.mjs --restore=<snapshot> --write   (restaura)
 *   node shopify-migration/scripts/apply-media-wiring.mjs --template                     (imprime un mapa vacío)
 * Opciones:
 *   --overwrite           permite reemplazar un valor existente distinto (por defecto: error)
 *   --theme-src=<dir>     carpeta del theme (defecto: shopify-migration/theme-src)
 *   --media-dir=<dir>     carpeta con los manifiestos (defecto: shopify-migration/content/media)
 *   --snapshot-dir=<dir>  dónde guardar el snapshot con --write (defecto: <temp>/radaelli-media-wiring-<fecha>)
 *   --allow-partial       SOLO simulación: tolera un mapa incompleto (incompatible con --write)
 *   --allow-ref-mismatch  degrada a AVISO el formato/nombre de referencia inesperado (el patrón
 *                         shopify://shop_images/… y shopify://files/videos/… es observado, NOT_VERIFIED en la doc)
 *   --allow-fake-refs     SOLO pruebas: permite --write con referencias FAKE, y únicamente si --theme-src
 *                         es una copia dentro de la carpeta temporal del sistema
 *   --force-restore       con --restore: restaura aunque el archivo cambió desde el wiring
 *   --verbose             imprime cada verificación de schema y manifiesto
 * Códigos de salida: 0 OK · 1 validación fallida (no se escribió nada) · 2 uso incorrecto ·
 *   3 falla al escribir (se revirtió solo o no se llegó a escribir) · 4 falla al escribir Y al revertir (restaurar a mano).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const SCRIPT_VERSION_LABEL = "03F";
const SCRIPT_FILE = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_FILE), "..");
const REAL_THEME_SRC = path.join(ROOT, "theme-src");
const DEFAULT_MEDIA_DIR = path.join(ROOT, "content", "media");
const MEDIA_MANIFEST_NAME = "media-migration-manifest.csv";
const UPLOAD_MANIFEST_NAME = "03E-upload-ready-manifest.csv";
const SNAPSHOT_MANIFEST = "SNAPSHOT.json";
const SNAPSHOT_VERSION = 1;
const INLINE_ARRAY_MAX_COLUMNS = 100;
const FAKE_RE = /FAKE|EJEMPLO|EXAMPLE|PLACEHOLDER|REEMPLAZAR|XXXX/i;
const REQUIRED_MANIFEST_COLUMNS = ["id", "asset", "source", "shopify_target_kind", "shopify_target", "pos_x", "pos_y", "zoom", "status"];

/** Destinos en el theme. `block` = clave del bloque en templates/index.json. */
const THEME_WIRING = [
  { id: "M01", template: "templates/index.json", section: "hero", sectionType: "hero", schemaFile: "sections/hero.liquid", setting: "hero_video", settingType: "video" },
  ...[
    ["M03", "oasis-natural", "image", "image_picker"],
    ["M04", "oasis-natural", "video", "video"],
    ["M05", "aurora-viva", "image", "image_picker"],
    ["M06", "aurora-viva", "video", "video"],
    ["M07", "espuma-de-ola", "image", "image_picker"],
    ["M08", "espuma-de-ola", "video", "video"],
    ["M09", "salidas-de-bano", "image", "image_picker"],
  ].map(([id, block, setting, settingType]) => ({
    id,
    template: "templates/index.json",
    section: "featured-categories",
    sectionType: "featured-categories",
    schemaFile: "sections/featured-categories.liquid",
    block,
    blockType: "category",
    blockCollection: block,
    setting,
    settingType,
  })),
  {
    id: "M14",
    template: "templates/product.json",
    section: "main",
    sectionType: "main-product",
    schemaFile: "sections/main-product.liquid",
    setting: "size_guide_image",
    settingType: "image_picker",
    companion: { setting: "size_guide_collection", settingType: "collection", value: "oasis-natural" },
  },
];
/** Metafields de colección: solo se imprimen (se cargan en el Admin). */
const COLLECTION_WIRING = [
  { id: "M10", handle: "oasis-natural", title: "Oasis Natural" },
  { id: "M11", handle: "aurora-viva", title: "Aurora Viva" },
  { id: "M12", handle: "espuma-de-ola", title: "Espuma de Ola" },
  { id: "M13", handle: "salidas-de-bano", title: "Salidas de Baño" },
];
const KNOWN_IDS = new Set([...THEME_WIRING.map((w) => w.id), ...COLLECTION_WIRING.map((w) => w.id)]);
const THEME_TEMPLATES = [...new Set(THEME_WIRING.map((w) => w.template))];
const THEME_SCHEMA_FILES = [...new Set(THEME_WIRING.map((w) => w.schemaFile))];
/** Ids que comparten archivo a propósito: M06 = M01 (mismo ETag b53a3029… en 03D y en 03F). */
const ALLOWED_SHARED_GROUPS = [["M01", "M06"]];

// Formato observado de las referencias (NOT_VERIFIED en la doc oficial: ver 03E §3 y 03F).
const REF_CHARS = "[A-Za-z0-9._()%~-]+";
const IMAGE_EXT = "(?:jpe?g|png|webp|gif|heic)";
const VIDEO_EXT = "(?:mp4|mov|webm)";
const THEME_REF_RE = {
  image_picker: new RegExp(`^shopify://shop_images/${REF_CHARS}\\.${IMAGE_EXT}$`, "i"),
  video: new RegExp(`^shopify://files/videos/${REF_CHARS}\\.${VIDEO_EXT}$`, "i"),
};
const THEME_REF_EXAMPLE = { image_picker: "shopify://shop_images/<archivo>.<jpg|png|webp>", video: "shopify://files/videos/<archivo>.<mp4|mov|webm>" };
const COLLECTION_REF_RES = [
  /^gid:\/\/shopify\/MediaImage\/\d+$/,
  new RegExp(`^${REF_CHARS}\\.${IMAGE_EXT}$`, "i"),
  new RegExp(`^shopify://shop_images/${REF_CHARS}\\.${IMAGE_EXT}$`, "i"),
];

// ---------------------------------------------------------------- utilidades

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const posix = (p) => p.split(path.sep).join("/");
const short = (hex) => `${hex.slice(0, 12)}…`;

function isInside(child, parent) {
  const r = path.relative(path.resolve(parent), path.resolve(child));
  return r === "" || (r !== ".." && !r.startsWith(`..${path.sep}`) && !path.isAbsolute(r));
}

function parseArgs(argv) {
  const opts = {
    write: false,
    overwrite: false,
    template: false,
    map: null,
    themeSrc: REAL_THEME_SRC,
    themeSrcGiven: false,
    mediaDir: DEFAULT_MEDIA_DIR,
    snapshotDir: null,
    restore: null,
    forceRestore: false,
    allowPartial: false,
    allowRefMismatch: false,
    allowFakeRefs: false,
    verbose: false,
  };
  let sawDry = false;
  for (const arg of argv) {
    if (arg === "--write") opts.write = true;
    else if (arg === "--dry-run") sawDry = true;
    else if (arg === "--overwrite") opts.overwrite = true;
    else if (arg === "--template") opts.template = true;
    else if (arg === "--allow-partial") opts.allowPartial = true;
    else if (arg === "--allow-ref-mismatch") opts.allowRefMismatch = true;
    else if (arg === "--allow-fake-refs") opts.allowFakeRefs = true;
    else if (arg === "--force-restore") opts.forceRestore = true;
    else if (arg === "--verbose") opts.verbose = true;
    else if (arg.startsWith("--map=")) opts.map = path.resolve(arg.slice(6));
    else if (arg.startsWith("--theme-src=")) {
      opts.themeSrc = path.resolve(arg.slice(12));
      opts.themeSrcGiven = true;
    } else if (arg.startsWith("--media-dir=")) opts.mediaDir = path.resolve(arg.slice(12));
    else if (arg.startsWith("--snapshot-dir=")) opts.snapshotDir = path.resolve(arg.slice(15));
    else if (arg.startsWith("--restore=")) opts.restore = path.resolve(arg.slice(10));
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else throw new Error(`opción desconocida: ${arg}`);
  }
  if (opts.help) return opts;
  if (opts.write && sawDry) throw new Error("--write y --dry-run son excluyentes");
  if (opts.allowPartial && opts.write) throw new Error("--allow-partial es solo para simulación: incompatible con --write (todo o nada)");
  if (opts.forceRestore && !opts.restore) throw new Error("--force-restore solo tiene sentido con --restore=<snapshot>");
  if (opts.restore && (opts.map || opts.template)) throw new Error("--restore no se combina con --map ni --template");
  if (opts.snapshotDir && !opts.write) throw new Error("--snapshot-dir solo tiene sentido con --write");
  if (opts.allowFakeRefs) {
    if (!opts.write) throw new Error("--allow-fake-refs solo tiene sentido con --write (en seco los mapas FAKE ya se aceptan)");
    if (!isInside(opts.themeSrc, os.tmpdir()) || isInside(opts.themeSrc, REAL_THEME_SRC) || isInside(REAL_THEME_SRC, opts.themeSrc)) {
      throw new Error("--allow-fake-refs solo se permite con --theme-src dentro de la carpeta temporal del sistema (una copia), nunca con el theme-src real");
    }
  }
  if (!opts.template && !opts.restore && !opts.map) throw new Error("falta --map=<archivo.json> (o --template para ver el formato, o --restore=<snapshot>)");
  return opts;
}

function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let rec = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQ = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQ = true;
    else if (c === ",") {
      rec.push(field);
      field = "";
    } else if (c === "\r") continue;
    else if (c === "\n") {
      rec.push(field);
      rows.push(rec);
      rec = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || rec.length > 0) {
    rec.push(field);
    rows.push(rec);
  }
  const [header, ...data] = rows.filter((r) => r.length > 1 || r[0] !== "");
  return { header: header ?? [], records: data.map((r) => Object.fromEntries((header ?? []).map((h, i) => [h, r[i] ?? ""]))) };
}

/** JSON del bloque {% schema %} de una sección. */
function readSchema(themeSrc, schemaFile) {
  const text = fs.readFileSync(path.join(themeSrc, schemaFile), "utf8");
  const m = /\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/.exec(text);
  if (!m) throw new Error(`${schemaFile}: sin {% schema %}`);
  return JSON.parse(m[1]);
}

/** Separa el comentario que Shopify antepone a veces a los templates JSON (theme pull). */
function splitTemplate(text) {
  const m = /^(\uFEFF?\s*\/\*[\s\S]*?\*\/\s*)/.exec(text);
  return m ? { prefix: m[1], json: text.slice(m[1].length) } : { prefix: "", json: text };
}

/**
 * Serializa con el estilo de los templates del repo: 2 espacios, objetos
 * siempre en varias líneas ({} si están vacíos), arrays de primitivos en una
 * línea si la línea completa entra en 100 columnas.
 */
function formatJSON(value) {
  const isPrimitive = (v) => v === null || ["string", "number", "boolean"].includes(typeof v);
  function fmt(v, indent, lineStart, trailing) {
    if (Array.isArray(v)) {
      if (v.length === 0) return "[]";
      if (v.every(isPrimitive)) {
        const inline = `[${v.map((x) => JSON.stringify(x)).join(", ")}]`;
        if (lineStart + inline.length + trailing <= INLINE_ARRAY_MAX_COLUMNS) return inline;
      }
      const pad = " ".repeat(indent + 2);
      const items = v.map((x, i) => pad + fmt(x, indent + 2, pad.length, i < v.length - 1 ? 1 : 0));
      return `[\n${items.join(",\n")}\n${" ".repeat(indent)}]`;
    }
    if (v && typeof v === "object") {
      const keys = Object.keys(v);
      if (keys.length === 0) return "{}";
      const pad = " ".repeat(indent + 2);
      const lines = keys.map((k, i) => {
        const head = `${pad}${JSON.stringify(k)}: `;
        return head + fmt(v[k], indent + 2, head.length, i < keys.length - 1 ? 1 : 0);
      });
      return `{\n${lines.join(",\n")}\n${" ".repeat(indent)}}`;
    }
    return JSON.stringify(v);
  }
  return fmt(value, 0, 0, 0);
}

/** Diff de líneas (LCS) con 3 líneas de contexto, estilo unificado. */
function unifiedDiff(label, before, after) {
  const a = before.split("\n");
  const b = after.split("\n");
  const n = a.length;
  const m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) ops.push({ t: " ", s: a[i], ai: i++, bj: j++ });
    else if (i < n && (j === m || lcs[i + 1][j] >= lcs[i][j + 1])) ops.push({ t: "-", s: a[i], ai: i++, bj: j });
    else ops.push({ t: "+", s: b[j], ai: i, bj: j++ });
  }
  const changed = ops.map((o, k) => (o.t !== " " ? k : -1)).filter((k) => k >= 0);
  if (changed.length === 0) return "";
  const out = [`--- a/${label}`, `+++ b/${label}`];
  let k = 0;
  while (k < changed.length) {
    let start = Math.max(0, changed[k] - 3);
    let end = Math.min(ops.length - 1, changed[k] + 3);
    while (k + 1 < changed.length && changed[k + 1] - 3 <= end + 1) {
      k += 1;
      end = Math.min(ops.length - 1, changed[k] + 3);
    }
    const hunk = ops.slice(start, end + 1);
    const aStart = hunk[0].ai + 1;
    const bStart = hunk[0].bj + 1;
    const aLen = hunk.filter((o) => o.t !== "+").length;
    const bLen = hunk.filter((o) => o.t !== "-").length;
    out.push(`@@ -${aStart},${aLen} +${bStart},${bLen} @@`);
    for (const o of hunk) out.push(`${o.t}${o.s}`);
    k += 1;
  }
  return out.join("\n");
}

/**
 * Decodifica un archivo de texto tolerando lo que produce una redirección `>` de
 * PowerShell: UTF-8 con BOM (EF BB BF) o, en Windows PowerShell 5.1 sin configurar,
 * UTF-16LE con BOM (FF FE). JSON.parse falla con cualquiera de los dos BOM.
 */
function decodeText(buf, file) {
  let text;
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) text = buf.subarray(2).toString("utf16le");
  else if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) throw new Error(`${file}: UTF-16BE no soportado; guardarlo como UTF-8`);
  else text = buf.toString("utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return text;
}

function readJsonFile(file) {
  return JSON.parse(decodeText(fs.readFileSync(file), file));
}

/**
 * JSON.parse se queda en silencio con la ÚLTIMA de dos claves iguales. Este recorrido
 * (sobre un texto ya válido) las detecta: devuelve [{ path, key, line, firstLine }].
 */
function findDuplicateKeys(text) {
  const dups = [];
  const stack = [];
  let line = 1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "\n") line += 1;
    else if (c === "{") stack.push({ obj: true, keys: new Map(), expectKey: true, lastKey: null });
    else if (c === "[") stack.push({ obj: false, lastKey: null });
    else if (c === "}" || c === "]") stack.pop();
    else if (c === ",") {
      const top = stack[stack.length - 1];
      if (top?.obj) top.expectKey = true;
    } else if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      const top = stack[stack.length - 1];
      if (top?.obj && top.expectKey) {
        const key = JSON.parse(text.slice(i, j + 1));
        if (top.keys.has(key)) {
          const parents = stack.slice(0, -1).map((f) => (f.obj ? f.lastKey : "[]"));
          dups.push({ key, path: [...parents, key].join("."), line, firstLine: top.keys.get(key) });
        } else top.keys.set(key, line);
        top.lastKey = key;
        top.expectKey = false;
      }
      i = j;
    }
  }
  return dups;
}

/** Parsea JSON y convierte claves duplicadas en errores (no en silencio). */
function parseJsonChecked(text, label) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { data: null, errors: [`${label}: JSON inválido (${e.message})`] };
  }
  const errors = findDuplicateKeys(text).map((d) => `${label}: clave duplicada "${d.path}" (líneas ${d.firstLine} y ${d.line})`);
  return { data, errors };
}

function roundDecimal(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return String(Number(n.toFixed(9)));
}

function fileProblem(file, needWrite) {
  try {
    if (!fs.statSync(file).isFile()) return "no es un archivo";
    fs.accessSync(file, fs.constants.R_OK);
    if (needWrite) fs.accessSync(file, fs.constants.W_OK);
    return null;
  } catch (e) {
    return e.code === "ENOENT" ? "no existe" : `no accesible (${e.code ?? e.message})`;
  }
}

/** Archivos sin los cuales no se puede ni simular. */
function requiredFiles(opts) {
  return [
    { label: `manifiesto de media (${MEDIA_MANIFEST_NAME})`, abs: path.join(opts.mediaDir, MEDIA_MANIFEST_NAME), write: false },
    ...THEME_TEMPLATES.map((t) => ({ label: `theme ${t}`, abs: path.join(opts.themeSrc, t), write: true })),
    ...THEME_SCHEMA_FILES.map((s) => ({ label: `theme ${s}`, abs: path.join(opts.themeSrc, s), write: false })),
  ];
}

// ---------------------------------------------------------------- referencias

/** Nombre de archivo (minúsculas) que una referencia apunta; null si es un gid. */
function refBasename(ref) {
  if (/^gid:\/\//.test(ref)) return null;
  const last = ref.split("/").pop();
  try {
    return decodeURIComponent(last).toLowerCase();
  } catch {
    return last.toLowerCase();
  }
}

const extOf = (name) => (/\.([A-Za-z0-9]+)$/.exec(name)?.[1] ?? "").toLowerCase().replace("jpeg", "jpg");
const stemOf = (name) => path.basename(name).replace(/\.[^.]+$/, "");

/**
 * @param map      objeto ya parseado del mapa
 * @param ctx      { upload?: Map, allowRefMismatch?: boolean }
 */
function validateMap(map, ctx = {}) {
  const errors = [];
  const warnings = [];
  const invalid = new Set(); // ids con referencia presente pero inválida: no cuentan como cubiertos
  /** true si el desajuste se acepta (--allow-ref-mismatch, queda como AVISO); false si es error. */
  const mismatch = (message) => {
    if (ctx.allowRefMismatch) {
      warnings.push(`${message} (aceptado por --allow-ref-mismatch)`);
      return true;
    }
    errors.push(message);
    return false;
  };
  if (!map || typeof map !== "object" || Array.isArray(map)) return { errors: ["el mapa debe ser un objeto JSON"], warnings, refs: {}, invalid };
  const refs = map.refs;
  if (!refs || typeof refs !== "object" || Array.isArray(refs)) return { errors: ['falta el objeto "refs"'], warnings, refs: {}, invalid };
  const out = {};
  for (const [id, value] of Object.entries(refs)) {
    if (id === "M02") {
      errors.push("M02 (poster del Hero) es NO_MIGRAR: el theme no tiene campo de poster");
      continue;
    }
    if (!KNOWN_IDS.has(id)) {
      errors.push(`${id}: id desconocido${KNOWN_IDS.has(id.toUpperCase()) ? ` (¿quisiste ${id.toUpperCase()}?)` : ""}`);
      continue;
    }
    if (value === null || value === "") continue;
    const reject = (message) => {
      errors.push(message);
      invalid.add(id);
    };
    if (typeof value !== "string") {
      reject(`${id}: el valor debe ser texto o null`);
      continue;
    }
    if (value !== value.trim() || /[\s"'\\<>\u0000-\u001f]/.test(value)) {
      reject(`${id}: la referencia tiene espacios, comillas, barras invertidas o caracteres de control`);
      continue;
    }
    if (value.length > 512 || value.includes("..")) {
      reject(`${id}: referencia demasiado larga o con ".."`);
      continue;
    }
    const theme = THEME_WIRING.find((w) => w.id === id);
    if (theme) {
      if (!value.startsWith("shopify://")) {
        reject(`${id}: una referencia de theme debe empezar con shopify:// (se copia del Editor de temas, ver el runbook); recibí "${value}"`);
        continue;
      }
      if (!THEME_REF_RE[theme.settingType].test(value)) {
        const msg = `${id}: formato de referencia inesperado para un setting ${theme.settingType}; se espera ${THEME_REF_EXAMPLE[theme.settingType]}; recibí "${value}"`;
        if (!mismatch(msg)) {
          invalid.add(id);
          continue;
        }
      }
    } else if (!COLLECTION_REF_RES.some((re) => re.test(value))) {
      reject(`${id}: para metafields usar el nombre del archivo en Archivos (<nombre>.<jpg|png|webp>) o gid://shopify/MediaImage/<n>; recibí "${value}"`);
      continue;
    }
    out[id] = value;
  }

  // Duplicados: un mismo archivo no puede alimentar dos destinos distintos (salvo M01/M06).
  const byName = new Map();
  for (const [id, value] of Object.entries(out)) {
    const key = (refBasename(value) ?? value).toLowerCase();
    byName.set(key, [...(byName.get(key) ?? []), id]);
  }
  for (const [name, ids] of byName) {
    if (ids.length < 2) continue;
    const sharedByManifest = ctx.upload && new Set(ids.map((id) => ctx.upload.get(id)?.file)).size === 1 && ctx.upload.get(ids[0])?.file;
    const allowed = ALLOWED_SHARED_GROUPS.some((g) => ids.every((id) => g.includes(id))) || sharedByManifest;
    if (!allowed) errors.push(`referencia duplicada: ${ids.join(" y ")} apuntan al mismo archivo "${out[ids[0]].split("/").pop()}" (cada destino lleva su propio archivo; solo M01 y M06 comparten video)`);
  }

  // Cruce con el manifiesto de subida: la referencia de un id debe ser SU archivo preparado.
  if (ctx.upload) {
    for (const [id, ref] of Object.entries(out)) {
      const row = ctx.upload.get(id);
      const name = refBasename(ref);
      if (!row?.file || !name) continue;
      const stem = stemOf(row.file).toLowerCase();
      if (!name.includes(stem)) {
        if (!mismatch(`${id}: la referencia "${ref}" no contiene el nombre del archivo preparado "${stemOf(row.file)}": ¿archivo equivocado en este destino?`)) {
          invalid.add(id);
          delete out[id];
        }
      } else if (extOf(name) !== extOf(row.file)) warnings.push(`${id}: la extensión de la referencia (.${extOf(name)}) difiere de la del archivo preparado (.${extOf(row.file)})`);
    }
    // Dos ids que salieron del mismo archivo deberían llevar la misma referencia.
    const byFile = new Map();
    for (const id of Object.keys(out)) {
      const f = ctx.upload.get(id)?.file;
      if (f) byFile.set(f, [...(byFile.get(f) ?? []), id]);
    }
    for (const [f, ids] of byFile) {
      if (ids.length > 1 && new Set(ids.map((id) => out[id].toLowerCase())).size > 1) warnings.push(`${ids.join(" y ")} salieron del mismo archivo preparado (${f}): conviene usar la misma referencia (subir una sola vez)`);
    }
  }
  return { errors, warnings, refs: out, invalid };
}

// ---------------------------------------------------------------- contexto (schemas + manifiestos)

function readCsvFile(file) {
  return parseCSV(decodeText(fs.readFileSync(file), file));
}

function loadContext(opts) {
  const errors = [];
  const checks = [];
  const { header, records } = readCsvFile(path.join(opts.mediaDir, MEDIA_MANIFEST_NAME));
  const missingCols = REQUIRED_MANIFEST_COLUMNS.filter((c) => !header.includes(c));
  if (missingCols.length) errors.push(`el manifiesto de media no tiene las columnas: ${missingCols.join(", ")}`);
  const manifest = new Map();
  for (const r of records) {
    if (manifest.has(r.id)) errors.push(`el manifiesto de media repite el id ${r.id}`);
    manifest.set(r.id, r);
  }
  if (errors.length) return { errors, checks, manifest, upload: null, required: [], optional: [] };

  const schemas = new Map();
  for (const w of THEME_WIRING) {
    if (!schemas.has(w.schemaFile)) {
      try {
        schemas.set(w.schemaFile, readSchema(opts.themeSrc, w.schemaFile));
      } catch (e) {
        schemas.set(w.schemaFile, null);
        errors.push(`${w.schemaFile}: no se pudo leer el schema (${e.message})`);
      }
    }
    const schema = schemas.get(w.schemaFile);
    if (schema) {
      const settingsList = w.block ? schema.blocks?.find((b) => b.type === w.blockType)?.settings : schema.settings;
      const where = w.block ? `${w.schemaFile} > block "${w.blockType}"` : w.schemaFile;
      for (const s of [{ setting: w.setting, settingType: w.settingType }, ...(w.companion ? [w.companion] : [])]) {
        const def = settingsList?.find((x) => x.id === s.setting);
        if (!def) errors.push(`${w.id}: ${where} no define el setting "${s.setting}"`);
        else if (def.type !== s.settingType) errors.push(`${w.id}: ${where} > ${s.setting} es "${def.type}", se esperaba "${s.settingType}"`);
        else checks.push({ kind: "schema", text: `schema OK  ${where} > ${s.setting} (${def.type})` });
      }
    }
    const row = manifest.get(w.id);
    const target = row?.shopify_target ?? "";
    const needles = [w.template, w.setting, ...(w.block ? [w.block] : []), ...(w.companion ? [`${w.companion.setting}=${w.companion.value}`] : [])];
    if (!row) errors.push(`${w.id}: no está en el manifiesto de media`);
    else if (!needles.every((x) => target.includes(x))) errors.push(`${w.id}: el manifiesto dice "${target}" y el script espera ${needles.join(" + ")}`);
    else checks.push({ kind: "manifest", text: `manifiesto OK  ${w.id} -> ${target}` });
  }
  for (const c of COLLECTION_WIRING) {
    const row = manifest.get(c.id);
    if (!row) errors.push(`${c.id}: no está en el manifiesto de media`);
    else if (row.shopify_target_kind !== "collection_metafields" || !row.shopify_target.startsWith(`${c.handle} >`)) errors.push(`${c.id}: destino inesperado en el manifiesto (${row.shopify_target})`);
    else checks.push({ kind: "manifest", text: `manifiesto OK  ${c.id} -> ${row.shopify_target}` });
  }

  // Ids requeridos = filas del manifiesto que no son NO_MIGRAR ni OPCIONAL. Si el manifiesto
  // exige un id que este script no sabe conectar, se detiene (el mapa no podría cubrirlo).
  const required = [];
  const optional = [];
  for (const [id, row] of manifest) {
    if (/^NO_MIGRAR$/i.test(row.status)) continue;
    if (!KNOWN_IDS.has(id)) {
      errors.push(`${id}: el manifiesto lo exige (${row.status}) pero este script no sabe conectarlo`);
      continue;
    }
    (/^OPCIONAL$/i.test(row.status) ? optional : required).push(id);
  }
  const order = (a, b) => a.localeCompare(b);
  required.sort(order);
  optional.sort(order);

  let upload = null;
  const uploadFile = path.join(opts.mediaDir, UPLOAD_MANIFEST_NAME);
  if (fs.existsSync(uploadFile)) {
    const parsed = readCsvFile(uploadFile);
    if (!parsed.header.includes("id") || !parsed.header.includes("file")) errors.push(`${UPLOAD_MANIFEST_NAME}: le faltan las columnas id y/o file`);
    else upload = new Map(parsed.records.map((r) => [r.id, r]));
  }
  return { errors, checks, manifest, upload, required, optional };
}

// ---------------------------------------------------------------- parche de templates

/** Rutas de hojas que cambian entre dos objetos JSON. */
function diffPaths(a, b, prefix = "") {
  if (a === undefined && b && typeof b === "object" && !Array.isArray(b)) a = {}; // objeto nuevo: se compara hoja por hoja
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null || Array.isArray(a) !== Array.isArray(b)) return JSON.stringify(a) === JSON.stringify(b) ? [] : [prefix];
  const out = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out.push(...diffPaths(a[k], b[k], prefix ? `${prefix}.${k}` : k));
  return out;
}

function expectedPaths(w) {
  const base = w.block ? `sections.${w.section}.blocks.${w.block}.settings` : `sections.${w.section}.settings`;
  return [`${base}.${w.setting}`, ...(w.companion ? [`${base}.${w.companion.setting}`] : [])];
}

function patchTemplates(themeSrc, refs, { overwrite }) {
  const errors = [];
  const changes = [];
  const files = new Map();
  for (const w of THEME_WIRING) {
    if (!files.has(w.template)) {
      const beforeBuf = fs.readFileSync(path.join(themeSrc, w.template));
      const original = beforeBuf.toString("utf8");
      const { prefix, json } = splitTemplate(original);
      const parsed = parseJsonChecked(json, w.template);
      errors.push(...parsed.errors);
      const data = parsed.data ?? {};
      const eol = original.includes("\r\n") ? "\r\n" : "\n";
      const roundTrip = prefix + formatJSON(data).replace(/\n/g, eol) + (original.endsWith("\n") ? eol : "");
      files.set(w.template, { beforeBuf, original, prefix, data, pristine: structuredClone(data), eol, sameFormat: roundTrip === original, expected: new Set() });
    }
    const f = files.get(w.template);
    const section = f.data.sections?.[w.section];
    if (!section || section.type !== w.sectionType) {
      errors.push(`${w.id}: ${w.template} no tiene la sección "${w.section}" de tipo "${w.sectionType}"`);
      continue;
    }
    let holder = section;
    if (w.block) {
      const block = section.blocks?.[w.block];
      if (!block || block.type !== w.blockType) {
        errors.push(`${w.id}: ${w.template} > ${w.section} no tiene el bloque "${w.block}" (${w.blockType})`);
        continue;
      }
      if (block.settings?.collection !== w.blockCollection) {
        errors.push(`${w.id}: el bloque "${w.block}" apunta a la colección "${block.settings?.collection}", se esperaba "${w.blockCollection}"`);
        continue;
      }
      holder = block;
    }
    for (const p of expectedPaths(w)) f.expected.add(p);
    const value = refs[w.id];
    const where = `${w.template} > ${w.section}${w.block ? ` > ${w.block}` : ""}`;
    if (value === undefined) {
      changes.push({ id: w.id, where, setting: w.setting, status: "omitido (sin referencia en el mapa)" });
      continue;
    }
    holder.settings = holder.settings ?? {};
    const pairs = [[w.setting, value], ...(w.companion ? [[w.companion.setting, w.companion.value]] : [])];
    for (const [key, next] of pairs) {
      const prev = holder.settings[key];
      if (prev === next) changes.push({ id: w.id, where, setting: key, status: "sin cambio (ya tenía ese valor)" });
      else if (prev !== undefined && prev !== "" && !overwrite) errors.push(`${w.id}: ${where} > ${key} ya vale "${prev}" (usar --overwrite para reemplazarlo)`);
      else {
        holder.settings[key] = next;
        changes.push({ id: w.id, where, setting: key, status: prev === undefined || prev === "" ? `nuevo: ${next}` : `reemplaza "${prev}" por ${next}` });
      }
    }
  }
  const outputs = [];
  for (const [template, f] of files) {
    const after = f.prefix + formatJSON(f.data).replace(/\n/g, f.eol) + (f.original.endsWith("\n") ? f.eol : "");
    const check = parseJsonChecked(splitTemplate(after).json, `${template} (resultado)`);
    errors.push(...check.errors);
    // Invariante: lo único que cambia son los settings de media de este script.
    const changed = diffPaths(f.pristine, f.data);
    const stray = changed.filter((p) => !f.expected.has(p));
    if (stray.length) errors.push(`${template}: el parche tocaría rutas no previstas (${stray.join(", ")}): no se escribe`);
    const afterBuf = Buffer.from(after, "utf8");
    outputs.push({ template, before: f.original, after, beforeBuf: f.beforeBuf, afterBuf, beforeSha: sha256(f.beforeBuf), afterSha: sha256(afterBuf), sameFormat: f.sameFormat, changedPaths: changed });
  }
  return { errors, changes, outputs };
}

function collectionAssignments(manifest, refs) {
  const lines = [];
  for (const c of COLLECTION_WIRING) {
    const row = manifest.get(c.id);
    const ref = refs[c.id];
    lines.push(`Colección ${c.title} (${c.handle}) — Admin > Productos > Colecciones > ${c.title} > Metacampos`);
    lines.push(`  custom.cover_image (archivo de imagen) = ${ref ?? "PENDIENTE (falta en el mapa)"}   [${c.id}]`);
    for (const [key, col] of [["image_pos_x", "pos_x"], ["image_pos_y", "pos_y"], ["zoom", "zoom"]]) {
      const raw = row[col];
      const rounded = roundDecimal(raw);
      const note = rounded !== null && rounded !== String(Number(raw)) ? `   (03D: ${raw}; number_decimal admite 9 decimales)` : "";
      lines.push(`  custom.${key} (decimal) = ${rounded ?? "NOT_AVAILABLE"}${note}`);
    }
    lines.push("  custom.cover_video = (dejar vacío: el banner real no tiene video)");
  }
  return lines;
}

function mapTemplate(upload) {
  const refs = {};
  for (const id of [...KNOWN_IDS].sort()) {
    const file = upload?.get(id)?.file ?? null;
    refs[id] = null;
    if (file) refs[`_${id}_archivo_preparado`] = file;
  }
  return JSON.stringify(
    {
      _instrucciones:
        "Reemplazar cada null por la referencia copiada del theme (shopify://…) para M01, M03–M09 y M14, y por el nombre del archivo en Contenido > Archivos (o su gid) para M10–M13. M07 es opcional (puede quedar null). Las claves que empiezan con _ son solo ayudas y se ignoran. Ver content/media/03F-media-owner-runbook.md.",
      refs,
    },
    null,
    2,
  );
}

// ---------------------------------------------------------------- escritura atómica

function writeFileDurable(file, buf, flag = "w") {
  const fd = fs.openSync(file, flag);
  try {
    fs.writeSync(fd, buf);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Todo o nada. entries: [{ target, next, nextSha, expectShas|null, rollback }]
 *  1) escribe TODOS los temporales y los verifica; 2) comprueba que ningún destino cambió;
 *  3) renombra todos; 4) verifica. Si algo falla, devuelve los ya renombrados a `rollback`.
 * Devuelve { ok } o { ok:false, error, rollbackFailed:[...] }.
 */
function commitAtomic(entries, { fault = null } = {}) {
  const tag = `${process.pid}-${crypto.randomBytes(3).toString("hex")}`;
  const tmps = [];
  const renamed = [];
  try {
    for (const e of entries) {
      const tmp = `${e.target}.wiring-${tag}.tmp`;
      writeFileDurable(tmp, e.next, "wx");
      tmps.push(tmp);
      if (sha256(fs.readFileSync(tmp)) !== e.nextSha) throw new Error(`el temporal de ${path.basename(e.target)} no coincide con lo esperado`);
    }
    for (const e of entries) {
      if (e.expectShas && !e.expectShas.includes(sha256(fs.readFileSync(e.target)))) throw new Error(`${path.basename(e.target)} cambió mientras se preparaba la escritura`);
    }
    for (const [i, e] of entries.entries()) {
      if (fault === "rename-second" && i === 1) throw new Error("falla simulada de prueba (RADAELLI_WIRING_TEST_FAULT)");
      fs.renameSync(tmps[i], e.target);
      renamed.push(e);
    }
    for (const e of entries) {
      if (sha256(fs.readFileSync(e.target)) !== e.nextSha) throw new Error(`verificación posterior fallida en ${path.basename(e.target)}`);
    }
    return { ok: true };
  } catch (error) {
    const rollbackFailed = [];
    for (const e of renamed) {
      try {
        const tmp = `${e.target}.wiring-${tag}.rollback`;
        writeFileDurable(tmp, e.rollback, "w");
        fs.renameSync(tmp, e.target);
      } catch {
        rollbackFailed.push(e.target);
      }
    }
    return { ok: false, error: error.message, rollbackFailed };
  } finally {
    for (const t of tmps) {
      try {
        fs.rmSync(t, { force: true });
      } catch {
        /* ya renombrado o inexistente */
      }
    }
  }
}

function createSnapshot(snapDir, opts, changed, mapText) {
  fs.mkdirSync(snapDir, { recursive: true });
  const files = [];
  for (const o of changed) {
    const dest = path.join(snapDir, o.template);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    writeFileDurable(dest, o.beforeBuf, "wx");
    if (sha256(fs.readFileSync(dest)) !== o.beforeSha) throw new Error(`la copia de ${o.template} no coincide con el original`);
    files.push({ path: o.template, bytesBefore: o.beforeBuf.length, beforeSha256: o.beforeSha, bytesAfter: o.afterBuf.length, afterSha256: o.afterSha });
  }
  const meta = { snapshotVersion: SNAPSHOT_VERSION, script: `apply-media-wiring ${SCRIPT_VERSION_LABEL}`, created: new Date().toISOString(), themeSrc: opts.themeSrc, mapFile: opts.map, mapSha256: sha256(Buffer.from(mapText)), files };
  writeFileDurable(path.join(snapDir, SNAPSHOT_MANIFEST), Buffer.from(`${JSON.stringify(meta, null, 2)}\n`), "wx");
  return meta;
}

function restoreCommand(snapDir, themeSrc, write) {
  const script = posix(path.relative(process.cwd(), SCRIPT_FILE) || SCRIPT_FILE);
  const theme = path.resolve(themeSrc) === REAL_THEME_SRC ? "" : ` --theme-src="${themeSrc}"`;
  return `node ${script} --restore="${snapDir}"${theme}${write ? " --write" : ""}`;
}

function testFault(opts) {
  const f = process.env.RADAELLI_WIRING_TEST_FAULT;
  // Inerte salvo en pruebas sobre una copia dentro de la carpeta temporal.
  return f && isInside(opts.themeSrc, os.tmpdir()) && !isInside(opts.themeSrc, REAL_THEME_SRC) ? f : null;
}

// ---------------------------------------------------------------- informe

function makeLogger() {
  const lines = [];
  const log = (s = "") => {
    lines.push(s);
    console.log(s);
  };
  return { log, lines };
}

function header(log, opts, title) {
  log(`=== ${title} (${SCRIPT_VERSION_LABEL}) ===`);
}

// ---------------------------------------------------------------- restaurar

function runRestore(opts) {
  const { log } = makeLogger();
  header(log, opts, "apply-media-wiring: RESTAURAR snapshot");
  log(`Modo:      ${opts.write ? "WRITE (restaura los archivos originales)" : "DRY-RUN (no escribe nada)"}`);
  log(`Snapshot:  ${opts.restore}`);
  const errors = [];
  const warnings = [];
  let meta = null;
  try {
    meta = JSON.parse(fs.readFileSync(path.join(opts.restore, SNAPSHOT_MANIFEST), "utf8"));
  } catch (e) {
    errors.push(`snapshot inválido o ausente: no se pudo leer ${SNAPSHOT_MANIFEST} (${e.code === "ENOENT" ? "no existe" : e.message})`);
  }
  const entries = [];
  if (meta) {
    if (meta.snapshotVersion !== SNAPSHOT_VERSION || !Array.isArray(meta.files) || meta.files.length === 0) errors.push(`${SNAPSHOT_MANIFEST}: versión o lista de archivos inválida`);
    const themeSrc = opts.themeSrcGiven ? opts.themeSrc : meta.themeSrc;
    log(`Theme:     ${themeSrc}${opts.themeSrcGiven ? "" : " (el del snapshot)"}`);
    log("");
    for (const f of Array.isArray(meta.files) ? meta.files : []) {
      if (!THEME_TEMPLATES.includes(f.path)) {
        errors.push(`${f.path}: ruta no permitida en un snapshot (solo ${THEME_TEMPLATES.join(", ")})`);
        continue;
      }
      let original;
      try {
        original = fs.readFileSync(path.join(opts.restore, f.path));
      } catch {
        errors.push(`${f.path}: falta la copia original dentro del snapshot`);
        continue;
      }
      if (sha256(original) !== f.beforeSha256) {
        errors.push(`${f.path}: la copia del snapshot está corrupta (SHA-256 distinto del registrado)`);
        continue;
      }
      const target = path.join(themeSrc, f.path);
      const problem = fileProblem(target, true);
      if (problem) {
        errors.push(`${f.path}: ${problem} en ${themeSrc}`);
        continue;
      }
      const current = fs.readFileSync(target);
      const curSha = sha256(current);
      if (curSha === f.beforeSha256) log(`  ${f.path}: ya está igual al original (sin cambios)`);
      else if (curSha === f.afterSha256) {
        log(`  ${f.path}: ${short(curSha)} (wiring) -> ${short(f.beforeSha256)} (original)`);
        entries.push({ target, next: original, nextSha: f.beforeSha256, expectShas: [curSha], rollback: current });
      } else if (opts.forceRestore) {
        warnings.push(`${f.path}: el archivo cambió desde el wiring (${short(curSha)}); se restaura igual por --force-restore`);
        entries.push({ target, next: original, nextSha: f.beforeSha256, expectShas: [curSha], rollback: current });
      } else errors.push(`${f.path}: cambió desde el wiring (SHA-256 actual ${short(curSha)} ≠ ${short(f.afterSha256)}); revisar o usar --force-restore`);
    }
  }
  log("");
  for (const w of warnings) log(`AVISO: ${w}`);
  for (const e of errors) log(`ERROR: ${e}`);
  if (errors.length) {
    log("");
    log(`RESULTADO: RECHAZADO — ${errors.length} error(es). No se escribió nada.`);
    return 1;
  }
  if (!opts.write) {
    log(`RESULTADO: DRY-RUN OK — se restaurarían ${entries.length} archivo(s). No se escribió nada. Para aplicar: agregar --write`);
    return 0;
  }
  if (entries.length === 0) {
    log("RESULTADO: OK — nada que restaurar.");
    return 0;
  }
  const res = commitAtomic(entries, { fault: testFault(opts) });
  if (!res.ok) {
    log(`ERROR: la restauración falló (${res.error}).`);
    if (res.rollbackFailed.length) {
      log(`ERROR: además NO se pudo volver al estado previo en: ${res.rollbackFailed.join(", ")}`);
      return 4;
    }
    log("RESULTADO: FALLÓ, pero los archivos quedaron como estaban antes (revertido).");
    return 3;
  }
  log(`RESULTADO: OK — restaurados ${entries.length} archivo(s): ${entries.map((e) => posix(path.relative(path.dirname(path.dirname(e.target)), e.target))).join(", ")}.`);
  return 0;
}

// ---------------------------------------------------------------- ejecución

function run(opts) {
  if (opts.restore) return runRestore(opts);
  const { log } = makeLogger();
  if (opts.template) {
    let upload = null;
    try {
      const f = path.join(opts.mediaDir, UPLOAD_MANIFEST_NAME);
      if (fs.existsSync(f)) upload = new Map(readCsvFile(f).records.map((r) => [r.id, r]));
    } catch {
      /* la plantilla se imprime igual, sin archivos preparados */
    }
    log(mapTemplate(upload));
    return 0;
  }

  header(log, opts, "apply-media-wiring");
  log(`Modo:      ${opts.write ? "WRITE (escribe theme-src/templates; todo o nada)" : "DRY-RUN (no escribe nada)"}${opts.allowPartial ? "  · --allow-partial" : ""}`);
  log(`Mapa:      ${opts.map}`);
  log(`Theme:     ${opts.themeSrc}`);
  log(`Manifiestos: ${opts.mediaDir}`);
  log("");

  // 1. Archivos requeridos: todos o ninguno.
  const problems = requiredFiles(opts)
    .map((f) => ({ ...f, problem: fileProblem(f.abs, opts.write && f.write) }))
    .filter((f) => f.problem);
  if (problems.length) {
    for (const p of problems) log(`ERROR: archivo requerido ausente o ilegible: ${p.label} — ${p.problem} (${p.abs})`);
    log("");
    log(`RESULTADO: RECHAZADO — ${problems.length} archivo(s) requerido(s) con problemas. No se escribió nada.`);
    return 1;
  }

  const ctx = loadContext(opts);
  const errors = [...ctx.errors];
  const warnings = [];

  // 2. Mapa: legible, JSON válido, sin claves duplicadas.
  let rawMap = null;
  let mapText = "";
  const mapProblem = fileProblem(opts.map, false);
  if (mapProblem) errors.push(`mapa ausente o ilegible: ${opts.map} — ${mapProblem}`);
  else {
    try {
      mapText = decodeText(fs.readFileSync(opts.map), opts.map);
    } catch (e) {
      errors.push(e.message);
    }
    if (mapText) {
      const parsed = parseJsonChecked(mapText, "mapa");
      errors.push(...parsed.errors);
      rawMap = parsed.data;
    }
  }
  if (rawMap && rawMap.refs && typeof rawMap.refs === "object") for (const k of Object.keys(rawMap.refs)) if (k.startsWith("_")) delete rawMap.refs[k];
  const mapResult = rawMap ? validateMap(rawMap, { upload: ctx.upload, allowRefMismatch: opts.allowRefMismatch }) : { errors: [], warnings: [], refs: {}, invalid: new Set() };
  errors.push(...mapResult.errors);
  warnings.push(...mapResult.warnings);
  const refs = mapResult.refs;
  const invalidIds = mapResult.invalid;

  // 3. Referencias de prueba.
  const fakes = Object.entries(refs).filter(([, v]) => FAKE_RE.test(v)).map(([id]) => id);
  if (fakes.length) {
    if (opts.write && !opts.allowFakeRefs) errors.push(`el mapa tiene referencias de prueba (${fakes.join(", ")}): --write rechazado`);
    else warnings.push(`mapa de PRUEBA (${fakes.join(", ")}): ${opts.write ? "escritura permitida solo por --allow-fake-refs sobre una copia temporal" : "sirve solo para --dry-run"}`);
  }

  // 4. Cobertura: TODOS los ids requeridos, o no se escribe nada.
  // Un id con referencia inválida ya tiene su propio ERROR: no se repite como "faltante".
  const missingIds = ctx.required.filter((id) => !refs[id] && !invalidIds.has(id));
  const coveredCount = ctx.required.filter((id) => refs[id]).length;
  if (rawMap && ctx.required.length && (missingIds.length || ctx.required.some((id) => invalidIds.has(id)))) {
    const msg = `mapa incompleto: ${coveredCount}/${ctx.required.length} ids requeridos con referencia válida${missingIds.length ? `; faltan ${missingIds.join(", ")}` : ""}${ctx.required.some((id) => invalidIds.has(id)) ? `; inválidos ${ctx.required.filter((id) => invalidIds.has(id)).join(", ")}` : ""}`;
    if (opts.allowPartial) warnings.push(`${msg}; simulación parcial por --allow-partial: --write lo rechazaría`);
    else errors.push(`${msg}; todo o nada: no se escribe nada`);
  }
  if (rawMap && !refs.M09) warnings.push("CRÍTICO: sin M09 la tarjeta Salidas de Baño queda sin media (la colección tiene 0 productos)");

  // 5. Manifiesto de subida (lo genera prepare-media-package.mjs --download).
  if (ctx.upload) {
    const noRow = ctx.required.filter((id) => !ctx.upload.has(id));
    if (noRow.length) {
      const msg = `${UPLOAD_MANIFEST_NAME} no tiene fila para ${noRow.join(", ")}: ¿prepare-media-package.mjs se corrió con --only?`;
      if (opts.allowPartial) warnings.push(msg);
      else errors.push(msg);
    }
  } else if (opts.write) errors.push(`--write exige ${UPLOAD_MANIFEST_NAME} (lo genera prepare-media-package.mjs --download): sin él no se puede comprobar que cada referencia sea el archivo de SU destino`);
  else warnings.push(`no existe ${UPLOAD_MANIFEST_NAME}: no se cruzan nombres de archivo (normal antes de --download); --write lo exigirá`);

  // 6. Parche en memoria.
  const patch = ctx.errors.length ? { errors: [], changes: [], outputs: [] } : patchTemplates(opts.themeSrc, refs, opts);
  errors.push(...patch.errors);

  // Verificaciones
  const nSchema = ctx.checks.filter((c) => c.kind === "schema").length;
  const nManifest = ctx.checks.filter((c) => c.kind === "manifest").length;
  log(`Verificaciones: archivos requeridos ${requiredFiles(opts).length}/${requiredFiles(opts).length} presentes · schema ${nSchema} OK · manifiesto ${nManifest} OK`);
  if (opts.verbose) for (const c of ctx.checks) log(`  ${c.text}`);
  log("");

  // Cobertura
  if (ctx.required.length) {
    log(`Cobertura del mapa: ${coveredCount}/${ctx.required.length} ids requeridos${ctx.optional.length ? ` (+ ${ctx.optional.length} opcional)` : ""}`);
    for (const id of [...ctx.required, ...ctx.optional].sort()) {
      const w = THEME_WIRING.find((x) => x.id === id);
      const dest = w ? `${w.template} > ${w.section}${w.block ? ` > ${w.block}` : ""} > ${w.setting}` : `${COLLECTION_WIRING.find((x) => x.id === id)?.handle} > custom.cover_image`;
      const isOpt = ctx.optional.includes(id);
      const state = refs[id] ? "OK      " : invalidIds.has(id) ? "INVÁLIDA" : isOpt ? "opcional" : "FALTA   ";
      log(`  ${id}  ${state} ${refs[id] ?? "(sin referencia válida)"}   -> ${dest}`);
    }
    log("");
  }

  log("Cambios en el theme:");
  if (errors.length) log("  (no se aplican: hay errores)");
  else for (const c of patch.changes) log(`  ${c.id}  ${c.where} > ${c.setting}: ${c.status}`);
  log("");
  for (const o of patch.outputs) {
    if (!o.sameFormat) warnings.push(`${o.template}: el formato original no se reproduce byte a byte; el diff puede incluir cambios de formato`);
  }
  if (errors.length) log("(diff omitido: hay errores; con errores no se escribe nada)");
  else
    for (const o of patch.outputs) {
      const diff = unifiedDiff(o.template, o.before, o.after);
      log(diff ? diff : `(${o.template}: sin cambios)`);
      log("");
    }
  if (errors.length) log("Metafields de colección: (se listan cuando el mapa no tiene errores)");
  else {
    log("Metafields de colección (se cargan a mano en el Admin; este script no los escribe):");
    for (const l of collectionAssignments(ctx.manifest, refs)) log(`  ${l}`);
  }
  log("");
  for (const w of warnings) log(`AVISO: ${w}`);
  for (const e of errors) log(`ERROR: ${e}`);
  if (errors.length) {
    log("");
    log(`RESULTADO: RECHAZADO — ${errors.length} error(es). No se escribió nada.${opts.write ? " (theme-src intacto)" : ""}`);
    return 1;
  }
  const changed = patch.outputs.filter((o) => o.beforeSha !== o.afterSha);
  if (!opts.write) {
    log("");
    log(`RESULTADO: DRY-RUN OK — ${changed.length} template(s) cambiarían${changed.length ? `: ${changed.map((o) => o.template).join(", ")}` : ""}. No se escribió nada. Para aplicar: agregar --write.`);
    return 0;
  }
  if (changed.length === 0) {
    log("");
    log("RESULTADO: OK — nada que escribir (theme-src ya tiene estas referencias).");
    return 0;
  }

  // 7. Snapshot verificado ANTES de tocar nada.
  const stamp = `${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomBytes(2).toString("hex")}`;
  const snapDir = opts.snapshotDir ?? path.join(os.tmpdir(), `radaelli-media-wiring-${stamp}`);
  log("");
  try {
    if (isInside(snapDir, opts.themeSrc)) throw new Error("el snapshot no puede estar dentro de theme-src (se publicaría con el theme)");
    if (fs.existsSync(snapDir) && fs.readdirSync(snapDir).length) throw new Error(`el directorio del snapshot ya existe y no está vacío: ${snapDir}`);
    createSnapshot(snapDir, opts, changed, mapText);
  } catch (e) {
    log(`ERROR: no se pudo crear el snapshot (${e.message}).`);
    log("RESULTADO: FALLÓ — no se escribió nada (theme-src intacto).");
    return 3;
  }
  log(`Snapshot verificado: ${snapDir}`);

  // 8. Escritura todo-o-nada.
  const res = commitAtomic(
    changed.map((o) => ({ target: path.join(opts.themeSrc, o.template), next: o.afterBuf, nextSha: o.afterSha, expectShas: [o.beforeSha], rollback: o.beforeBuf })),
    { fault: testFault(opts) },
  );
  if (!res.ok) {
    log(`ERROR: la escritura falló (${res.error}).`);
    if (res.rollbackFailed.length) {
      log(`ERROR: además NO se pudo volver al estado previo en: ${res.rollbackFailed.join(", ")}`);
      log(`Restaurar a mano: ${restoreCommand(snapDir, opts.themeSrc, true)}`);
      return 4;
    }
    log("RESULTADO: FALLÓ, pero los archivos quedaron como estaban antes (revertido automáticamente).");
    log(`Copia de los originales: ${snapDir}`);
    return 3;
  }
  log("");
  log("Escritos (SHA-256 antes -> después, verificado tras escribir):");
  for (const o of changed) log(`  ${o.template}  ${short(o.beforeSha)} -> ${short(o.afterSha)}  (${o.beforeBuf.length} -> ${o.afterBuf.length} bytes)`);
  log("");
  log(`Snapshot de rollback: ${snapDir}`);
  log(`  Ver qué restauraría:  ${restoreCommand(snapDir, opts.themeSrc, false)}`);
  log(`  Restaurar:            ${restoreCommand(snapDir, opts.themeSrc, true)}`);
  log("");
  log(`RESULTADO: OK — ${changed.length} template(s) escritos. Siguiente paso: runbook 03F (push SOLO de estos templates al theme sin publicar, con OK de la dueña).`);
  return 0;
}

export { formatJSON, unifiedDiff, validateMap, splitTemplate, readSchema, roundDecimal, readJsonFile, findDuplicateKeys, parseJsonChecked, commitAtomic, THEME_WIRING, COLLECTION_WIRING };

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_FILE;
if (invokedDirectly) {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(2);
  }
  if (opts.help) console.log(fs.readFileSync(SCRIPT_FILE, "utf8").split("*/")[0]);
  else {
    try {
      process.exitCode = run(opts);
    } catch (error) {
      console.error(`ERROR inesperado: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
