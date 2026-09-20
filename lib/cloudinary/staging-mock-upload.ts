import { randomUUID } from "node:crypto";
import { getAppEnvironment } from "lib/env/app-environment";

// Fase 2E del proyecto de staging/pentest (sep. 2026) -- ver
// docs/pentest-architecture.md. Cloudinary hoy comparte la MISMA cuenta
// entre Production y staging (ver lib/cloudinary/staging-folder.ts) --
// sin una credencial propia y separada para staging (no se pudo confirmar
// si CLOUDINARY_* de rada-staging tiene un valor real o quedó vacía tras
// la copia en bloque de variables que originó la Fase 2A -- no es legible
// vía Vercel CLI, ver Fase 2B), un pentest agresivo de subida de archivos
// NO debe poder tocar la cuenta real de Cloudinary de ninguna forma.
//
// Este mock reemplaza SOLO el paso final ("guardar en un host externo")
// cuando está activo -- toda la validación real que importa para el
// pentest (declarar tipo, magic bytes, tamaño máximo, redimensión/
// recompresión) sigue corriendo exactamente igual antes de este punto,
// así que el pentest de la superficie de ataque de subida sigue siendo
// completamente representativo. Si algún día se conecta una credencial de
// Cloudinary dedicada a staging, esto deja de activarse automáticamente
// (sin tocar código de nuevo) y usa esa cuenta real.
export function isCloudinaryStagingMockActive(): boolean {
  if (getAppEnvironment() !== "staging") return false;
  return (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  );
}

export type StagingMockUploadResult = {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
};

// Dominio .invalid (reservado por IANA, RFC 2606 -- nunca resuelve a nada
// real, mismo criterio que las cuentas @pentest.invalid de
// scripts/seed-staging-pentest.ts) para que sea imposible confundir esto
// con un asset real, aunque alguien copie el link fuera de contexto.
export function buildStagingMockUploadResult(params: {
  folder: string;
  extension: string;
  width: number;
  height: number;
}): StagingMockUploadResult {
  const publicId = `${params.folder}/staging-mock-${randomUUID()}`;
  return {
    secure_url: `https://staging-mock.radaelliswimwear.invalid/${publicId}.${params.extension}`,
    public_id: publicId,
    width: params.width,
    height: params.height,
  };
}
