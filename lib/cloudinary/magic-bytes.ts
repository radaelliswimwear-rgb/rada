import type { ALLOWED_IMAGE_TYPES } from "./types";

// Auditoría de seguridad (sep. 2026, hardening P2/P3): uploadProductImageAction
// solo validaba `file.type` -- el tipo MIME que el propio navegador declara
// en el FormData, un campo de texto arbitrario que cualquiera puede mandar
// con el valor que quiera en una llamada directa a esta Server Action (el
// Next-Action-Id es público en el bundle del cliente, mismo criterio que ya
// encontró la auditoría de seguridad para otras acciones). Nunca alcanza
// para confiar en que el contenido real del archivo sea lo que dice ser --
// un SVG (XML de texto plano, puede llevar <script> adentro) declarado como
// "image/png" pasaba esa validación sin problema.
//
// Esto lee los primeros bytes del archivo real y los compara contra la
// firma binaria conocida de cada formato -- información que el archivo NO
// puede mentir sobre sí mismo sin dejar de ser ese formato. Cubre
// exactamente los cuatro formatos que ALLOWED_IMAGE_TYPES admite; cualquier
// otra cosa (incluido un SVG, sea cual sea el Content-Type que declare)
// devuelve null.
export type DetectedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

function matchesBytes(
  buffer: Buffer,
  offset: number,
  expected: number[],
): boolean {
  if (buffer.length < offset + expected.length) return false;
  return expected.every((byte, i) => buffer[offset + i] === byte);
}

export function detectImageTypeFromMagicBytes(
  buffer: Buffer,
): DetectedImageType | null {
  // JPEG: FF D8 FF (los tres primeros bytes de todo JPEG real).
  if (matchesBytes(buffer, 0, [0xff, 0xd8, 0xff])) return "image/jpeg";

  // PNG: firma fija de 8 bytes definida por el estándar.
  if (
    matchesBytes(buffer, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return "image/png";
  }

  // GIF: "GIF87a" o "GIF89a" -- las dos versiones reales del formato.
  if (
    matchesBytes(buffer, 0, [0x47, 0x49, 0x46, 0x38]) &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return "image/gif";
  }

  // WebP: contenedor RIFF ("RIFF" en 0-3, tamaño en 4-7, "WEBP" en 8-11).
  if (
    matchesBytes(buffer, 0, [0x52, 0x49, 0x46, 0x46]) &&
    matchesBytes(buffer, 8, [0x57, 0x45, 0x42, 0x50])
  ) {
    return "image/webp";
  }

  return null;
}
