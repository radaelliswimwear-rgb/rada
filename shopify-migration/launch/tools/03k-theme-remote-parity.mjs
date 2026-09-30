#!/usr/bin/env node
/**
 * 03K — paridad "remoto = ZIP": compara un theme descargado (theme pull) con el ZIP RC extraído.
 *
 *   node launch/tools/03k-theme-remote-parity.mjs <carpeta-del-ZIP-extraído> <carpeta-del-pull> [--json]
 *
 * Mismos archivos y mismo SHA-256; para .json, igualdad SEMÁNTICA (Shopify reserializa los JSON al guardarlos: espacios,
 * orden de claves y comentarios de cabecera cambian los bytes pero no el contenido). Solo lectura. Exit 1 si algo difiere.
 *
 * Cómo se usa (ver launch/03K-clean-store-bootstrap-runbook.md paso 3):
 *   1. Extraer dist/<rc>.zip a una carpeta A.
 *   2. npx shopify theme pull --store <tienda> --theme <id> --path <carpeta B vacía>
 *   3. node launch/tools/03k-theme-remote-parity.mjs A B
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const [A, B] = process.argv.slice(2).filter((x) => !x.startsWith("--"));
if (!A || !B) {
  console.error("uso: 03k-theme-remote-parity.mjs <zip-extraído> <pull> [--json]");
  process.exit(2);
}
const walk = (root, rel = "", out = {}) => {
  for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
    const r = rel ? rel + "/" + e.name : e.name;
    if (e.isDirectory()) walk(root, r, out);
    else out[r] = fs.readFileSync(path.join(root, r));
  }
  return out;
};
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const stripComments = (s) => s.replace(/^﻿/, "").replace(/\/\*[\s\S]*?\*\//g, "").trim();
const canon = (v) => (Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v);

export function compare(a, b) {
  const onlyA = Object.keys(a).filter((k) => !(k in b));
  const onlyB = Object.keys(b).filter((k) => !(k in a));
  const exact = [];
  const jsonSemantic = [];
  const different = [];
  for (const k of Object.keys(a)) {
    if (!(k in b)) continue;
    if (sha(a[k]) === sha(b[k])) exact.push(k);
    else if (k.endsWith(".json")) {
      try {
        const ja = JSON.stringify(canon(JSON.parse(stripComments(a[k].toString("utf8")))));
        const jb = JSON.stringify(canon(JSON.parse(stripComments(b[k].toString("utf8")))));
        (ja === jb ? jsonSemantic : different).push(k);
      } catch (e) {
        different.push(`${k} (JSON no analizable: ${e.message})`);
      }
    } else different.push(k);
  }
  return { zip: Object.keys(a).length, remote: Object.keys(b).length, exactos: exact.length, jsonSemanticamenteIguales: jsonSemantic.length, soloZip: onlyA, soloRemoto: onlyB, distintos: different, ok: onlyA.length === 0 && onlyB.length === 0 && different.length === 0 };
}

if (process.argv[1] && process.argv[1].endsWith("03k-theme-remote-parity.mjs")) {
  const r = compare(walk(A), walk(B));
  if (process.argv.includes("--json")) console.log(JSON.stringify(r));
  else {
    console.log(`ZIP ${r.zip} archivos | remoto ${r.remote} | exactos ${r.exactos} | JSON semánticamente iguales ${r.jsonSemanticamenteIguales} | solo ZIP ${r.soloZip.length} | solo remoto ${r.soloRemoto.length} | distintos ${r.distintos.length}`);
    for (const k of [...r.soloZip.map((x) => "solo ZIP: " + x), ...r.soloRemoto.map((x) => "solo remoto: " + x), ...r.distintos.map((x) => "distinto: " + x)]) console.log("  " + k);
    console.log(r.ok ? "PARIDAD: PASS" : "PARIDAD: FAIL");
  }
  process.exit(r.ok ? 0 : 1);
}
