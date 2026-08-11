export const MAX_IMAGE_BYTES = 50 * 1024 * 1024; // 50 MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
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
