#!/usr/bin/env node
/**
 * Fase 03E -- paquete de media listo para subir a Shopify > Contenido > Archivos.
 *
 * Lee content/media/media-migration-manifest.csv (03D) y, SOLO con --download,
 * baja cada asset desde su URL EXACTA del Cloudinary propio, lo valida y lo
 * deja en content/media/prepared/<id>-<basename>, más el manifiesto
 * content/media/03E-upload-ready-manifest.csv. No sube nada a Shopify, no
 * recorta ni edita: la única transformación es el límite de resolución de
 * 03C (c_limit,w_5000,h_5000,q_95 = misma foto, lado largo <= 5000 px, sin
 * recorte), y solo para imágenes de más de 25 MP o de más de 5000 px.
 *
 * Uso (Node >= 20, sin dependencias):
 *   node shopify-migration/scripts/prepare-media-package.mjs              (= --dry-run)
 *   node shopify-migration/scripts/prepare-media-package.mjs --download --video-variant=served   (recomendado, ver "Códec")
 *   node shopify-migration/scripts/prepare-media-package.mjs --download                          (videos originales HEVC)
 *
 * Opciones:
 *   --dry-run               por defecto: imprime el plan; no hace red ni escribe nada
 *   --download              descarga, valida y escribe prepared/ + manifiesto
 *   --only=M01,M13          limita a esos ids (con --download, el manifiesto se
 *                           fusiona con el existente: solo se reemplazan esas filas)
 *   --include-reference     incluye filas NO_MIGRAR (M02: poster de referencia)
 *   --video-variant=original|served
 *                           original (defecto): el archivo guardado (HEVC según 03D).
 *                           served: la misma URL con f_auto,q_auto, que es lo que
 *                           sirve el sitio (lib/cloudinary/video-url.ts:6-9). El
 *                           códec servido depende del cliente (03D: avc1 con curl).
 *   --repo-root=<dir>       raíz del repo para las filas "repo:" (defecto: carpeta
 *                           padre de shopify-migration)
 *
 * Límites que valida (help.shopify.com/en/manual/shopify-admin/productivity-tools/file-uploads):
 *   imagen: JPEG/PNG/WEBP, <= 20 MB, <= 25 MP, relación entre 100:1 y 1:100;
 *           más el lado <= 5000 px que usó 03C (help.shopify.com/en/manual/products/product-media/product-media-types)
 *   video:  MP4/MOV/WEBM, <= 1 GB, lado entre 100 y 4096 px, duración 0,25 s a 10 min.
 *   Códec: la misma página ("Recommended video specifications") lista como
 *   "Supported codecs" solo "Video: H.264 (AVC)". HEVC (hvc1/hev1) NO figura;
 *   la página tampoco dice que se rechace (aceptación NOT_VERIFIED). El script
 *   lo informa como aviso y no decide: la variante recomendada es
 *   --video-variant=served, verificando que el códec leído sea avc1.
 *
 * Seguridad: solo https://res.cloudinary.com/n8l3p85c/... (el Cloudinary propio
 * del manifiesto), sin seguir redirecciones, con tope de bytes y timeout. Las
 * filas "repo:" se copian desde el repo (sin red) y se verifica su SHA-256.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "content", "media", "media-migration-manifest.csv");
const OUT_DIR = path.join(ROOT, "content", "media", "prepared");
const OUT_MANIFEST = path.join(ROOT, "content", "media", "03E-upload-ready-manifest.csv");

const ALLOWED_HOST = "res.cloudinary.com";
const ALLOWED_PATH_PREFIX = "/n8l3p85c/";
const IMAGE_TRANSFORM = "c_limit,w_5000,h_5000,q_95";
const VIDEO_SERVED_TRANSFORM = "f_auto,q_auto";

const LIMITS = {
  imageMaxBytes: 20 * 1000 * 1000, // "20 MB": se usa la lectura más estricta (10^6)
  imageMaxPixels: 25 * 1000 * 1000,
  imageMaxSide: 5000,
  imageMaxAspect: 100,
  videoMaxBytes: 1000 * 1000 * 1000, // "1 GB"
  videoMaxSide: 4096,
  videoMinSide: 100,
  videoMaxSeconds: 600,
  videoMinSeconds: 0.25,
};
const DOWNLOAD_CAP_BYTES = 200 * 1000 * 1000; // guarda dura, muy por encima de lo esperado
const FETCH_TIMEOUT_MS = 120_000;

const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpeg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const VIDEO_TYPES = new Map([
  ["video/mp4", "mp4"],
  ["video/quicktime", "mov"],
  ["video/webm", "webm"],
]);
const OUT_COLUMNS = ["id", "asset", "source_url", "delivered_url", "file", "bytes", "dimensions", "sha256", "shopify_target"];
const REQUIRED_MANIFEST_COLUMNS = ["id", "asset", "source", "bytes", "dimensions", "shopify_target_kind", "shopify_target", "delivery_transform", "status", "note"];

// ---------------------------------------------------------------- CLI

function parseArgs(argv) {
  const opts = { download: false, only: null, includeReference: false, videoVariant: "original", repoRoot: path.resolve(ROOT, "..") };
  let sawDry = false;
  for (const arg of argv) {
    if (arg === "--download") opts.download = true;
    else if (arg === "--dry-run") sawDry = true;
    else if (arg === "--include-reference") opts.includeReference = true;
    else if (arg.startsWith("--only=")) opts.only = new Set(arg.slice(7).split(",").map((s) => s.trim()).filter(Boolean));
    else if (arg.startsWith("--video-variant=")) opts.videoVariant = arg.slice(16);
    else if (arg.startsWith("--repo-root=")) opts.repoRoot = path.resolve(arg.slice(12));
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else throw new Error(`opción desconocida: ${arg}`);
  }
  if (opts.download && sawDry) throw new Error("--download y --dry-run son excluyentes");
  if (!["original", "served"].includes(opts.videoVariant)) throw new Error("--video-variant debe ser original o served");
  return opts;
}

// ---------------------------------------------------------------- CSV

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
  return { header, records: data.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""]))) };
}

function csvField(value) {
  const s = String(value ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCSV(columns, records) {
  return [columns.join(","), ...records.map((r) => columns.map((c) => csvField(r[c])).join(","))].join("\n") + "\n";
}

// ---------------------------------------------------------------- plan

function parseDims(text) {
  const m = /^(\d+)\s*x\s*(\d+)/i.exec(text || "");
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}

function overImageLimits({ width, height }) {
  return width * height > LIMITS.imageMaxPixels || width > LIMITS.imageMaxSide || height > LIMITS.imageMaxSide;
}

function insertTransform(url, kind, transform) {
  const marker = `/${kind}/upload/`;
  if (!url.includes(marker)) throw new Error(`la URL no tiene ${marker}`);
  return url.replace(marker, `${marker}${transform}/`);
}

function sanitizeBasename(name) {
  const ext = path.extname(name);
  const stem = name.slice(0, name.length - ext.length);
  const cleanStem = stem.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "archivo";
  const cleanExt = ext.toLowerCase().replace(/[^.a-z0-9]/g, "");
  return cleanStem + cleanExt;
}

function checkRemoteUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("URL inválida");
  }
  if (url.protocol !== "https:") throw new Error("solo https");
  if (url.hostname !== ALLOWED_HOST) throw new Error(`host fuera de la allowlist (${url.hostname})`);
  if (!url.pathname.startsWith(ALLOWED_PATH_PREFIX)) throw new Error("ruta fuera del Cloudinary propio");
  if (url.search || url.hash || url.username || url.password) throw new Error("la URL no debe llevar query, hash ni credenciales");
  const kind = url.pathname.includes("/image/upload/") ? "image" : url.pathname.includes("/video/upload/") ? "video" : null;
  if (!kind) throw new Error("no es /image/upload/ ni /video/upload/");
  return { kind, basename: decodeURIComponent(url.pathname.split("/").pop()) };
}

function buildPlan(records, opts) {
  const plan = [];
  const problems = [];
  const seenIds = new Set();
  for (const r of records) {
    if (!/^M\d{2}$/.test(r.id)) problems.push(`${r.id || "(sin id)"}: id inválido`);
    if (seenIds.has(r.id)) problems.push(`${r.id}: id duplicado`);
    seenIds.add(r.id);
    if (opts.only && !opts.only.has(r.id)) continue;

    const item = {
      id: r.id,
      asset: r.asset,
      source_url: r.source,
      shopify_target: r.shopify_target,
      status: r.status,
      expectedBytes: /^\d+$/.test(r.bytes) ? Number(r.bytes) : null,
      expectedDims: parseDims(r.dimensions),
      manifestDims: r.dimensions,
      note: r.note,
      notes: [],
    };
    if (r.status === "NO_MIGRAR" && !opts.includeReference) {
      item.action = "skip";
      item.notes.push("NO_MIGRAR (solo referencia; usar --include-reference para incluirla)");
      plan.push(item);
      continue;
    }
    try {
      if (r.source.startsWith("repo:")) {
        const m = /^repo:(.+?) \(sha256 ([0-9a-f]{64})\)$/.exec(r.source);
        if (!m) throw new Error("fila repo: sin el formato 'repo:<ruta> (sha256 <hex>)'");
        const abs = path.resolve(opts.repoRoot, m[1]);
        const rel = path.relative(opts.repoRoot, abs);
        if (rel.startsWith("..") || path.isAbsolute(rel)) throw new Error("ruta repo: fuera de la raíz del repo");
        item.action = "local-copy";
        item.kind = "image";
        item.localPath = abs;
        item.expectedSha256 = m[2];
        item.delivered_url = r.source.replace(/ \(sha256 [0-9a-f]{64}\)$/, "");
        item.basename = path.basename(m[1]);
        if (!fs.existsSync(abs)) throw new Error(`no existe ${abs}`);
        item.localBytes = fs.statSync(abs).size;
      } else {
        const { kind, basename } = checkRemoteUrl(r.source);
        item.action = "download";
        item.kind = kind;
        item.basename = basename;
        item.delivered_url = r.source;
        const manifestTransform = (r.delivery_transform || "").trim();
        if (kind === "image") {
          const needs = item.expectedDims ? overImageLimits(item.expectedDims) : false;
          if (manifestTransform && manifestTransform !== IMAGE_TRANSFORM) {
            throw new Error(`delivery_transform inesperado (${manifestTransform})`);
          }
          if (needs || manifestTransform) {
            item.delivered_url = insertTransform(r.source, "image", IMAGE_TRANSFORM);
            item.transformed = true;
            const d = item.expectedDims;
            item.notes.push(
              d
                ? `supera el límite (${d.width}x${d.height} = ${((d.width * d.height) / 1e6).toFixed(1)} MP): entrega ${IMAGE_TRANSFORM}, sin recorte`
                : `delivery_transform del manifiesto: ${IMAGE_TRANSFORM}`,
            );
          } else if (!item.expectedDims) {
            item.notes.push("dimensiones desconocidas en el manifiesto: se validan al descargar");
          }
        } else {
          if (manifestTransform) throw new Error("delivery_transform en un video no está previsto");
          if (opts.videoVariant === "served") {
            item.delivered_url = insertTransform(r.source, "video", VIDEO_SERVED_TRANSFORM);
            item.transformed = true;
            item.notes.push(`variante servida (${VIDEO_SERVED_TRANSFORM}); el códec depende del cliente`);
          }
          if (/hevc|hvc1/i.test(r.dimensions) && opts.videoVariant !== "served") {
            item.notes.push("HEVC según 03D: Shopify documenta solo H.264 (AVC); aceptación de HEVC NOT_VERIFIED (recomendado: --video-variant=served)");
          }
        }
      }
      item.file = `${item.id}-${sanitizeBasename(item.basename)}`;
      if (/mismo etag|mismo archivo|subir una sola vez/i.test(r.note)) item.notes.push("posible duplicado según 03D (se confirma por SHA-256 al descargar)");
      if (r.status === "OPCIONAL") item.notes.push("OPCIONAL: decisión de Daniela si se usa");
    } catch (error) {
      item.action = "error";
      problems.push(`${r.id}: ${error.message}`);
    }
    plan.push(item);
  }
  const files = plan.filter((p) => p.file).map((p) => p.file.toLowerCase());
  const dupFiles = files.filter((f, i) => files.indexOf(f) !== i);
  if (dupFiles.length) problems.push(`nombres de archivo repetidos: ${[...new Set(dupFiles)].join(", ")}`);
  if (opts.only) {
    for (const id of opts.only) if (!seenIds.has(id)) problems.push(`--only: ${id} no está en el manifiesto`);
  }
  return { plan, problems };
}

// ---------------------------------------------------------------- sniffing

function sniff(buf) {
  if (buf.length >= 8 && buf.readUInt32BE(0) === 0x89504e47 && buf.readUInt32BE(4) === 0x0d0a1a0a) return { kind: "image", format: "png" };
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { kind: "image", format: "jpeg" };
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return { kind: "image", format: "webp" };
  if (buf.length >= 12 && buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    return { kind: "video", format: brand === "qt  " ? "mov" : "mp4", brand };
  }
  if (buf.length >= 4 && buf.readUInt32BE(0) === 0x1a45dfa3) return { kind: "video", format: "webm" };
  return null;
}

function pngDims(buf) {
  // Firma (8) + largo (4) + "IHDR" (4) + ancho (4) + alto (4)
  if (buf.length < 24 || buf.toString("ascii", 12, 16) !== "IHDR") throw new Error("PNG sin IHDR");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function jpegDims(buf) {
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) throw new Error("JPEG: marcador inválido");
    const marker = buf[i + 1];
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = buf.readUInt16BE(i + 2);
    const isSOF = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSOF) {
      if (i + 9 > buf.length) break;
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    if (marker === 0xda || marker === 0xd9) break;
    i += 2 + len;
  }
  throw new Error("JPEG sin marcador SOF");
}

function webpDims(buf) {
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8X") return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  if (chunk === "VP8L") {
    const b = buf.readUInt32LE(21);
    return { width: 1 + (b & 0x3fff), height: 1 + ((b >> 14) & 0x3fff) };
  }
  if (chunk === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  throw new Error(`WEBP: chunk desconocido ${chunk}`);
}

function imageDims(buf, format) {
  if (format === "png") return pngDims(buf);
  if (format === "jpeg") return jpegDims(buf);
  if (format === "webp") return webpDims(buf);
  throw new Error(`formato de imagen no soportado: ${format}`);
}

/** Recorre cajas ISO-BMFF (MP4/MOV): ancho/alto (tkhd), duración (mvhd) y códec (stsd). */
function mp4Info(buf) {
  const CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl"]);
  const info = { tracks: [], durationSec: null };
  function walk(start, end, trak) {
    let i = start;
    while (i + 8 <= end) {
      let size = buf.readUInt32BE(i);
      const type = buf.toString("ascii", i + 4, i + 8);
      let header = 8;
      if (size === 1) {
        if (i + 16 > end) return;
        size = Number(buf.readBigUInt64BE(i + 8));
        header = 16;
      } else if (size === 0) size = end - i;
      if (size < header || i + size > end) return;
      const body = i + header;
      if (type === "trak") {
        const t = { width: 0, height: 0, codec: null };
        info.tracks.push(t);
        walk(body, i + size, t);
      } else if (CONTAINERS.has(type)) {
        walk(body, i + size, trak);
      } else if (type === "mvhd") {
        const version = buf[body];
        const timescale = version === 1 ? buf.readUInt32BE(body + 20) : buf.readUInt32BE(body + 12);
        const duration = version === 1 ? Number(buf.readBigUInt64BE(body + 24)) : buf.readUInt32BE(body + 16);
        if (timescale > 0) info.durationSec = duration / timescale;
      } else if (type === "tkhd" && trak) {
        trak.width = Math.round(buf.readUInt32BE(i + size - 8) / 65536);
        trak.height = Math.round(buf.readUInt32BE(i + size - 4) / 65536);
      } else if (type === "stsd" && trak) {
        if (body + 16 <= i + size) trak.codec = buf.toString("ascii", body + 12, body + 16);
      }
      i += size;
    }
  }
  walk(0, buf.length, null);
  const video = info.tracks.find((t) => t.width > 0 && t.height > 0);
  return { width: video?.width ?? null, height: video?.height ?? null, codec: video?.codec ?? null, durationSec: info.durationSec };
}

// ---------------------------------------------------------------- red

async function fetchCapped(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: "error", signal: controller.signal, headers: { "User-Agent": "radaelli-media-prep/03E" } });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const declared = Number(res.headers.get("content-length") || "0");
    if (declared > DOWNLOAD_CAP_BYTES) throw new Error(`content-length ${declared} supera el tope`);
    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > DOWNLOAD_CAP_BYTES) {
        controller.abort();
        throw new Error("la descarga supera el tope de bytes");
      }
      chunks.push(Buffer.from(value));
    }
    const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    return { buf: Buffer.concat(chunks), contentType };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(url) {
  try {
    return await fetchCapped(url);
  } catch (error) {
    if (/HTTP 4\d\d|tope/.test(error.message)) throw error;
    return fetchCapped(url);
  }
}

// ---------------------------------------------------------------- validación

function validateBuffer(item, buf, contentType) {
  const warnings = [];
  const sniffed = sniff(buf);
  if (!sniffed) throw new Error("tipo de archivo no reconocido por su cabecera");
  if (sniffed.kind !== item.kind) throw new Error(`se esperaba ${item.kind} y la cabecera dice ${sniffed.kind}`);
  if (contentType) {
    const map = item.kind === "image" ? IMAGE_TYPES : VIDEO_TYPES;
    const declared = map.get(contentType);
    if (!declared) throw new Error(`Content-Type no aceptado por Shopify Archivos: ${contentType}`);
    if (declared !== sniffed.format) throw new Error(`Content-Type ${contentType} no coincide con la cabecera (${sniffed.format})`);
  }
  let dimensions;
  if (item.kind === "image") {
    const { width, height } = imageDims(buf, sniffed.format);
    if (!width || !height) throw new Error("dimensiones inválidas");
    if (buf.length > LIMITS.imageMaxBytes) throw new Error(`pesa ${buf.length} bytes (> 20 MB)`);
    if (overImageLimits({ width, height })) throw new Error(`EXCEDE: ${width}x${height} (> 25 MP o > 5000 px)`);
    const aspect = Math.max(width / height, height / width);
    if (aspect > LIMITS.imageMaxAspect) throw new Error(`relación de aspecto fuera de 100:1 (${aspect.toFixed(1)})`);
    if (!item.transformed && item.expectedDims && (item.expectedDims.width !== width || item.expectedDims.height !== height)) {
      warnings.push(`dimensiones ${width}x${height} distintas del manifiesto (${item.manifestDims})`);
    }
    dimensions = `${width}x${height}`;
    return { format: sniffed.format, dimensions, warnings };
  }
  if (buf.length > LIMITS.videoMaxBytes) throw new Error(`pesa ${buf.length} bytes (> 1 GB)`);
  if (sniffed.format === "webm") {
    warnings.push("WEBM: dimensiones y duración no se analizan");
    return { format: sniffed.format, dimensions: "NOT_PARSED webm", warnings };
  }
  const info = mp4Info(buf);
  if (info.width && info.height) {
    if (Math.max(info.width, info.height) > LIMITS.videoMaxSide) throw new Error(`video de ${info.width}x${info.height} (> 4096 px)`);
    if (Math.min(info.width, info.height) < LIMITS.videoMinSide) throw new Error(`video de ${info.width}x${info.height} (< 100 px)`);
  } else warnings.push("no se pudo leer ancho/alto del video (tkhd)");
  if (info.durationSec != null) {
    if (info.durationSec > LIMITS.videoMaxSeconds) throw new Error(`dura ${info.durationSec.toFixed(1)} s (> 10 min)`);
    if (info.durationSec < LIMITS.videoMinSeconds) throw new Error(`dura ${info.durationSec.toFixed(2)} s (< 0,25 s)`);
  } else warnings.push("no se pudo leer la duración (mvhd)");
  // Shopify Archivos documenta como códec de video soportado solo H.264 (AVC): avc1/avc3.
  if (info.codec && /^(hvc1|hev1)$/.test(info.codec)) warnings.push(`códec ${info.codec} (HEVC): fuera de los códecs documentados por Shopify (H.264/AVC); usar --video-variant=served`);
  else if (info.codec && !/^(avc1|avc3)$/.test(info.codec)) warnings.push(`códec ${info.codec}: no es H.264 (AVC), el único códec de video documentado por Shopify; revisar antes de subir`);
  else if (!info.codec) warnings.push("no se pudo leer el códec (stsd): confirmar que sea H.264 (AVC) antes de subir");
  const dims = info.width && info.height ? `${info.width}x${info.height}` : "NOT_PARSED";
  const extra = [info.codec || "codec?", info.durationSec != null ? `${info.durationSec.toFixed(1)}s` : "dur?"].join(" ");
  return { format: sniffed.format, dimensions: `${dims} ${extra}`, warnings };
}

function extensionFor(format) {
  return { jpeg: ".jpg", png: ".png", webp: ".webp", mp4: ".mp4", mov: ".mov", webm: ".webm" }[format];
}

// ---------------------------------------------------------------- ejecución

function printPlan(plan, opts) {
  const line = (s = "") => console.log(s);
  line(`Manifiesto: ${path.relative(process.cwd(), MANIFEST) || MANIFEST}`);
  line(`Modo: ${opts.download ? "DOWNLOAD (red + escritura)" : "DRY-RUN (sin red, sin escritura)"}  |  video: ${opts.videoVariant}${opts.only ? `  |  --only ${[...opts.only].join(",")}` : ""}`);
  line("");
  for (const p of plan) {
    line(`${p.id}  ${p.action.toUpperCase().padEnd(10)} ${p.kind ?? "-"}  ${p.asset}`);
    if (p.action === "skip" || p.action === "error") {
      for (const n of p.notes) line(`      nota: ${n}`);
      continue;
    }
    line(`      origen:  ${p.source_url}`);
    if (p.delivered_url !== p.source_url) line(`      entrega: ${p.delivered_url}`);
    line(`      archivo: content/media/prepared/${p.file}`);
    const expected = [p.expectedBytes != null ? `${p.expectedBytes} bytes` : p.localBytes != null ? `${p.localBytes} bytes (local)` : null, p.manifestDims || null]
      .filter(Boolean)
      .join(", ");
    line(`      03D:     ${expected}${p.transformed ? "  (antes de la transformación)" : ""}`);
    line(`      destino: ${p.shopify_target}`);
    for (const n of p.notes) line(`      nota:    ${n}`);
  }
}

async function run(opts) {
  const { header, records } = parseCSV(fs.readFileSync(MANIFEST, "utf8"));
  const missing = REQUIRED_MANIFEST_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) throw new Error(`faltan columnas en el manifiesto: ${missing.join(", ")}`);

  const { plan, problems } = buildPlan(records, opts);
  printPlan(plan, opts);
  const active = plan.filter((p) => p.action === "download" || p.action === "local-copy");
  console.log("");
  console.log(
    `Resumen del plan: ${active.filter((p) => p.action === "download").length} descargas + ${active.filter((p) => p.action === "local-copy").length} copia local, ` +
      `${plan.filter((p) => p.action === "skip").length} omitidas, ${problems.length} problemas.`,
  );
  const expectedTotal = active.filter((p) => !p.transformed).reduce((s, p) => s + (p.expectedBytes ?? p.localBytes ?? 0), 0);
  console.log(`Bytes esperados (sin contar las entregas transformadas): ${expectedTotal}`);
  if (problems.length) {
    for (const pr of problems) console.log(`PROBLEMA: ${pr}`);
    process.exitCode = 1;
    return;
  }
  if (!opts.download) {
    console.log("DRY-RUN: no se descargó ni se escribió nada. Para ejecutar: agregar --download (requiere el OK de la dueña).");
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const results = [];
  const bySha = new Map();
  let errors = 0;
  let warnCount = 0;
  for (const p of active) {
    try {
      let buf;
      let contentType = "";
      if (p.action === "local-copy") {
        buf = fs.readFileSync(p.localPath);
        const sha = crypto.createHash("sha256").update(buf).digest("hex");
        if (sha !== p.expectedSha256) throw new Error(`SHA-256 local ${sha} distinto del manifiesto`);
      } else {
        ({ buf, contentType } = await fetchWithRetry(p.delivered_url));
      }
      let checked;
      try {
        checked = validateBuffer(p, buf, contentType);
      } catch (error) {
        // Manifiesto desactualizado: la imagen excede y no se había transformado -> una sola re-entrega limitada.
        if (p.action === "download" && p.kind === "image" && !p.transformed && /^EXCEDE/.test(error.message)) {
          p.delivered_url = insertTransform(p.source_url, "image", IMAGE_TRANSFORM);
          p.transformed = true;
          console.log(`${p.id}: ${error.message}; se reintenta con ${IMAGE_TRANSFORM}`);
          ({ buf, contentType } = await fetchWithRetry(p.delivered_url));
          checked = validateBuffer(p, buf, contentType);
        } else throw error;
      }
      const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
      const warnings = [...checked.warnings];
      if (!p.transformed && p.expectedBytes != null && p.expectedBytes !== buf.length) {
        warnings.push(`pesa ${buf.length} bytes y 03D midió ${p.expectedBytes}: el asset pudo cambiar desde la auditoría`);
      }
      // La extensión del archivo sigue al contenido real (p. ej. variante servida).
      const ext = extensionFor(checked.format);
      let file = p.file;
      if (ext && path.extname(file).toLowerCase() !== ext && !(ext === ".jpg" && /\.jpe?g$/i.test(file))) {
        file = file.slice(0, file.length - path.extname(file).length) + ext;
      }
      let relFile;
      if (bySha.has(sha256)) {
        const first = bySha.get(sha256);
        relFile = first.relFile;
        warnings.push(`idéntico byte a byte a ${first.id}: NO se escribe otro archivo; subir una sola vez y usar la misma referencia`);
      } else {
        const outPath = path.join(OUT_DIR, file);
        const tmp = `${outPath}.part`;
        fs.writeFileSync(tmp, buf);
        fs.renameSync(tmp, outPath);
        relFile = `prepared/${file}`;
        bySha.set(sha256, { id: p.id, relFile });
      }
      results.push({
        id: p.id,
        asset: p.asset,
        source_url: p.source_url,
        delivered_url: p.delivered_url,
        file: relFile,
        bytes: buf.length,
        dimensions: checked.dimensions,
        sha256,
        shopify_target: p.shopify_target,
      });
      console.log(`${p.id}: OK ${relFile} ${buf.length} bytes ${checked.dimensions} sha256 ${sha256.slice(0, 12)}…`);
      for (const w of warnings) {
        warnCount += 1;
        console.log(`${p.id}: AVISO ${w}`);
      }
    } catch (error) {
      errors += 1;
      console.log(`${p.id}: ERROR ${error.message}`);
    }
  }

  let rows = results;
  if (opts.only && fs.existsSync(OUT_MANIFEST)) {
    const prev = parseCSV(fs.readFileSync(OUT_MANIFEST, "utf8")).records.filter((r) => !results.some((x) => x.id === r.id));
    rows = [...prev, ...results].sort((a, b) => a.id.localeCompare(b.id));
  }
  fs.writeFileSync(OUT_MANIFEST, toCSV(OUT_COLUMNS, rows));
  console.log("");
  console.log(`Escrito: content/media/03E-upload-ready-manifest.csv (${rows.length} filas). OK ${results.length}, avisos ${warnCount}, errores ${errors}.`);
  console.log(`Archivos únicos para subir a Contenido > Archivos: ${new Set(rows.map((r) => r.file)).size}`);
  if (errors) process.exitCode = 1;
}

// Exportado solo para pruebas (sin red); el script corre únicamente si se lo invoca directo.
export { parseCSV, toCSV, buildPlan, sniff, imageDims, mp4Info, validateBuffer, insertTransform, sanitizeBasename, checkRemoteUrl, overImageLimits };

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(2);
  }
  if (opts.help) {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0]);
  } else {
    run(opts).catch((error) => {
      console.error(`ERROR: ${error.message}`);
      process.exitCode = 1;
    });
  }
}
