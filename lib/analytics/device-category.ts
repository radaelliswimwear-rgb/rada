// Deriva SOLO la categoría de dispositivo desde un User-Agent -- nunca se
// guarda el User-Agent completo (sección 25 del proceso: "no guardar
// User-Agent completo permanentemente salvo razón fuerte"). Heurística
// simple, deliberadamente sin dependencia externa (no ua-parser-js): mismo
// criterio de "no complejidad innecesaria" que el resto de la Fase 2A.
import type { DeviceCategory } from "./types";

export function deriveDeviceCategory(
  userAgent: string | null | undefined,
): DeviceCategory {
  if (!userAgent) return "UNKNOWN";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/.test(ua)) return "TABLET";
  if (/mobi|iphone|ipod|android/.test(ua)) return "MOBILE";
  return "DESKTOP";
}
