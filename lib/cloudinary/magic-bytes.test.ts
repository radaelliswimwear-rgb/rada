import { test } from "node:test";
import assert from "node:assert/strict";
import { detectImageTypeFromMagicBytes } from "./magic-bytes";

// Auditoría de seguridad (sep. 2026, hardening P2/P3): uploadProductImageAction
// (lib/cloudinary/upload-actions.ts) solo validaba el Content-Type que
// declara quien sube el archivo -- un campo de texto arbitrario, nunca una
// prueba de qué es el archivo de verdad. Este archivo prueba el detector de
// firma binaria en aislado: los cuatro formatos reales se reconocen por sus
// primeros bytes, cualquier otra cosa (incluido un SVG con un Content-Type
// falso) no.
//
// Cómo correrlo:
//   node --import tsx --test lib/cloudinary/magic-bytes.test.ts

test("reconoce un JPEG real por su firma (FF D8 FF)", () => {
  const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
  assert.equal(detectImageTypeFromMagicBytes(buffer), "image/jpeg");
});

test("reconoce un PNG real por su firma de 8 bytes", () => {
  const buffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
  ]);
  assert.equal(detectImageTypeFromMagicBytes(buffer), "image/png");
});

test("reconoce un GIF89a real", () => {
  const buffer = Buffer.from("GIF89a" + "resto de bytes", "binary");
  assert.equal(detectImageTypeFromMagicBytes(buffer), "image/gif");
});

test("reconoce un GIF87a real (versión más vieja del formato)", () => {
  const buffer = Buffer.from("GIF87a" + "resto de bytes", "binary");
  assert.equal(detectImageTypeFromMagicBytes(buffer), "image/gif");
});

test("reconoce un WebP real (contenedor RIFF + fourCC WEBP)", () => {
  const buffer = Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // tamaño (no importa para detectar)
    Buffer.from("WEBP", "ascii"),
    Buffer.from("VP8 más datos", "ascii"),
  ]);
  assert.equal(detectImageTypeFromMagicBytes(buffer), "image/webp");
});

test("un RIFF que NO es WebP (ej. un .wav/.avi) no se reconoce como imagen", () => {
  const buffer = Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([0x00, 0x00, 0x00, 0x00]),
    Buffer.from("WAVE", "ascii"),
  ]);
  assert.equal(detectImageTypeFromMagicBytes(buffer), null);
});

test("un SVG (XML de texto plano) nunca se reconoce como imagen, sin importar qué declare", () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script></svg>`;
  const buffer = Buffer.from(svg, "utf8");
  assert.equal(detectImageTypeFromMagicBytes(buffer), null);
});

test("un archivo arbitrario (ej. un .html o un ejecutable) no se reconoce como imagen", () => {
  const buffer = Buffer.from(
    "<html><body>no soy una imagen</body></html>",
    "utf8",
  );
  assert.equal(detectImageTypeFromMagicBytes(buffer), null);
});

test("un buffer vacío o demasiado corto no se reconoce como imagen (sin reventar)", () => {
  assert.equal(detectImageTypeFromMagicBytes(Buffer.alloc(0)), null);
  assert.equal(detectImageTypeFromMagicBytes(Buffer.from([0xff, 0xd8])), null);
});
