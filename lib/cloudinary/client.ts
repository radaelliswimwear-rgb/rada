import { v2 as cloudinary } from "cloudinary";

// Singleton de configuración, mismo criterio que lib/prisma.ts: falla rápido
// y con un mensaje claro si faltan las credenciales, en vez de dejar que
// Cloudinary tire un error genérico más abajo. Las credenciales viven solo en
// variables de entorno server-side (CLOUDINARY_*, sin prefijo NEXT_PUBLIC_) —
// nunca se leen ni se exponen desde el cliente.
let configured = false;

export function getCloudinary() {
  if (!configured) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        "Credenciales de Cloudinary no configuradas. Definí CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET (ver .env.example).",
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
      timeout: 20000,
    });
    configured = true;
  }

  return cloudinary;
}
