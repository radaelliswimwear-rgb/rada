/**
 * Empaqueta la app en un .zip REPRODUCIBLE, sin dependencias:
 *   shopify-migration/dist/radaelli-wishlist-app-<version>.zip
 *
 * - Entradas ordenadas por ruta (orden de bytes), con prefijo
 *   radaelli-wishlist-app-<version>/.
 * - Fecha fija (1980-01-01 00:00, la mínima de ZIP) y permisos fijos (0644).
 * - Método "stored" (sin compresión): así el resultado no depende de la
 *   versión de zlib. Los mismos bytes de entrada dan el mismo zip.
 * - Excluye .env* (incluido .env.example), node_modules, .git, .shopify,
 *   dist y *.log. Los nombres de las variables están en el README.
 * Imprime el SHA-256 del zip.
 *
 * Uso: node scripts/pack.mjs   (desde app/)   o   npm run pack
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, lstatSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const APP_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = join(APP_DIR, "..", "dist");

const DOS_TIME = 0x0000; // 00:00:00
const DOS_DATE = 0x0021; // 1980-01-01
const UTF8_FLAG = 0x0800;
const VERSION_NEEDED = 20;
const VERSION_MADE_BY = (3 << 8) | 20; // Unix, 2.0
const FILE_MODE = 0o100644;

export function isExcluded(relPath) {
  const segments = relPath.split("/");
  if (segments.some((segment) => segment.startsWith(".env"))) return true;
  if (segments.some((segment) => ["node_modules", ".git", ".shopify", "dist"].includes(segment))) return true;
  return relPath.endsWith(".log");
}

function listFiles(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(APP_DIR, full).split(sep).join("/");
    if (isExcluded(rel)) continue;
    const stat = lstatSync(full);
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) files.push(...listFiles(full));
    else if (stat.isFile()) files.push(rel);
  }
  return files;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export function buildZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBytes = Buffer.from(name, "utf8");
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(VERSION_NEEDED, 4);
    local.writeUInt16LE(UTF8_FLAG, 6);
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBytes, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(VERSION_MADE_BY, 4);
    central.writeUInt16LE(VERSION_NEEDED, 6);
    central.writeUInt16LE(UTF8_FLAG, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comentario
    central.writeUInt16LE(0, 34); // disco
    central.writeUInt16LE(0, 36); // atributos internos
    central.writeUInt32LE((FILE_MODE << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBytes);

    offset += local.length + nameBytes.length + data.length;
  }
  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, centralDirectory, end]);
}

function main() {
  const { version } = JSON.parse(readFileSync(join(APP_DIR, "package.json"), "utf8"));
  const root = `radaelli-wishlist-app-${version}`;
  const files = listFiles(APP_DIR).sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  const entries = files.map((rel) => ({ name: `${root}/${rel}`, data: readFileSync(join(APP_DIR, ...rel.split("/"))) }));
  const zip = buildZip(entries);
  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, `${root}.zip`);
  writeFileSync(outPath, zip);
  const sha256 = createHash("sha256").update(zip).digest("hex");
  console.log(`zip: ${outPath}`);
  console.log(`entries: ${entries.length}  bytes: ${zip.length}`);
  console.log(`sha256: ${sha256}`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) main();
