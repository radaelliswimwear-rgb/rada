// Lógica pura de saneamiento para el payload de analytics (Fase 2A). Mismo
// patrón que sanitizeAttributionValue (lib/attribution/parsing.ts): rechazo
// de '<'/'>' en vez de escapar, límite de longitud corto -- sin librerías
// externas, es el estilo ya establecido en el repo.

const MAX_SEARCH_TERM_LENGTH = 100;
const MAX_CUSTOM_STRING_LENGTH = 200;
const MAX_CUSTOM_PAYLOAD_KEYS = 20;

// null si el término está vacío, es puro whitespace, o contiene '<'/'>'
// (nunca se va a renderizar como HTML, pero tampoco cuesta cerrar la
// puerta). Trunca a MAX_SEARCH_TERM_LENGTH -- una búsqueda "absurdamente
// larga" (sección 30 del proceso) se recorta, no se rechaza entera.
export function sanitizeSearchTerm(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.includes("<") || trimmed.includes(">")) return null;
  return trimmed.slice(0, MAX_SEARCH_TERM_LENGTH);
}

function sanitizeCustomStringValue(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.includes("<") || trimmed.includes(">")) return null;
  return trimmed.slice(0, MAX_CUSTOM_STRING_LENGTH);
}

// Payload custom limitado (sección 24: "no almacenar blobs gigantes"): tope
// de claves, valores string saneados/truncados, valores number/boolean/null
// se pasan tal cual (no hay HTML que inyectar en un number). Claves con
// valor string que queda vacío/rechazado tras sanear se OMITEN del
// resultado en vez de guardarse como null -- así un intento de inyección no
// dejar ni rastro de la clave.
export function sanitizeCustomPayload(
  raw: Record<string, string | number | boolean | null> | null | undefined,
): Record<string, string | number | boolean | null> {
  if (!raw) return {};
  const entries = Object.entries(raw).slice(0, MAX_CUSTOM_PAYLOAD_KEYS);
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of entries) {
    if (typeof value === "string") {
      const sanitized = sanitizeCustomStringValue(value);
      if (sanitized !== null) result[key] = sanitized;
      continue;
    }
    result[key] = value;
  }
  return result;
}
