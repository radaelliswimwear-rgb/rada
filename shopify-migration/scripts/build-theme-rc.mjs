#!/usr/bin/env node
/**
 * Empaquetado reproducible del theme (Fase 02M).
 *
 *   node shopify-migration/scripts/build-theme-rc.mjs [--name radaelli-shopify-theme-rc1]
 *        [--theme-check-source "0 errors / 0 warnings"] [--theme-check-zip "..."]
 *        [--baseline "qué fases incluye este RC"]
 *
 * - Toma SOLO los 7 directorios de un theme Shopify desde theme-src/
 *   (assets, config, layout, locales, sections, snippets, templates), en
 *   orden alfabético. Nada más entra al ZIP: ni README, ni reportes, ni
 *   node_modules, ni harness, ni .git.
 * - ZIP determinista: fecha fija (1980-01-01 00:00), sin permisos ni datos
 *   extra, deflate nivel 9. Mismo contenido => mismos bytes => mismo SHA-256
 *   (con la misma versión de zlib de Node).
 * - Escribe dist/<name>.zip y dist/release-manifest.json (hash por archivo).
 * - Solo lectura sobre theme-src. No sube nada, no usa red, no usa secretos.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const THEME = path.resolve(here, "..", "theme-src");
const DIST = path.resolve(here, "..", "dist");
const THEME_DIRS = ["assets", "config", "layout", "locales", "sections", "snippets", "templates"];

const args = process.argv.slice(2);
const arg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : fallback;
};
const NAME = arg("--name", "radaelli-shopify-theme-rc1");

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

function listFiles() {
  const files = [];
  for (const dir of THEME_DIRS) {
    const abs = path.join(THEME, dir);
    if (!fs.existsSync(abs)) throw new Error(`falta el directorio ${dir}/`);
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (entry.isDirectory()) throw new Error(`subdirectorio no permitido en un theme: ${dir}/${entry.name}`);
      if (entry.name.startsWith(".")) throw new Error(`archivo oculto: ${dir}/${entry.name}`);
      files.push(`${dir}/${entry.name}`);
    }
  }
  return files.sort();
}

// ZIP mínimo y determinista (APPNOTE 6.3): header local + directorio central + EOCD.
function buildZip(files) {
  const DOS_TIME = 0;
  const DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1980-01-01
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const name of files) {
    const data = fs.readFileSync(path.join(THEME, name));
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const crc = zlib.crc32(data) >>> 0;
    const nameBuf = Buffer.from(name, "utf8");

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // versión necesaria
    local.writeUInt16LE(0x0800, 6); // nombres UTF-8
    local.writeUInt16LE(useDeflate ? 8 : 0, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, body);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // hecho por: MS-DOS / 2.0 (sin permisos Unix)
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(useDeflate ? 8 : 0, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += local.length + nameBuf.length + body.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, centralBuf, eocd]);
}

const files = listFiles();
const zip = buildZip(files);
const again = buildZip(files);
if (sha256(zip) !== sha256(again)) throw new Error("el ZIP no es determinista");

fs.mkdirSync(DIST, { recursive: true });
const zipPath = path.join(DIST, `${NAME}.zip`);
fs.writeFileSync(zipPath, zip);

const manifest = {
  release: NAME,
  generatedAt: new Date().toISOString(),
  generatedAtNote: "La fecha es solo del manifiesto: los bytes del ZIP no dependen de ella (fecha fija 1980-01-01 en cada entrada).",
  baseline: arg("--baseline", "Fases 02A–02L + correcciones de 02M (theme offline, sin tienda)"),
  source: {
    path: "shopify-migration/theme-src (worktree aislado worktree-shopify-migration-prep; theme-src no está versionado en git)",
    includedDirectories: THEME_DIRS,
    excluded: ["README.md", "reportes/documentación", "harness/tests", "node_modules", ".git", "scratch", "secretos", "launch.json"],
  },
  zip: {
    path: `shopify-migration/dist/${NAME}.zip`,
    bytes: zip.length,
    sha256: sha256(zip),
    deterministic: true,
    builder: `build-theme-rc.mjs (Node ${process.version}, zlib ${process.versions.zlib})`,
  },
  themeCheck: {
    source: arg("--theme-check-source", "no informado"),
    extractedZip: arg("--theme-check-zip", "no informado"),
  },
  totalFiles: files.length,
  files: files.map((name) => {
    const data = fs.readFileSync(path.join(THEME, name));
    return { path: name, bytes: data.length, sha256: sha256(data) };
  }),
};
fs.writeFileSync(path.join(DIST, "release-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ zip: manifest.zip, totalFiles: manifest.totalFiles }, null, 2));
