export const MAX_IMAGE_BYTES = 50 * 1024 * 1024; // 50 MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

// Video de portada (Sprint 21): un loop corto de fondo, no una película —
// 40 MB ya alcanza de sobra para varios segundos en buena calidad y evita
// que alguien suba sin querer un video de varios minutos que arrastre la
// carga de la página de inicio.
export const MAX_VIDEO_BYTES = 40 * 1024 * 1024; // 40 MB
export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export type CloudinaryUploadResult =
  | {
      success: true;
      url: string;
      publicId: string;
      width: number;
      height: number;
    }
  | { success: false; error: string };

export type CloudinaryDeleteResult =
  | { success: true }
  | { success: false; error: string };
