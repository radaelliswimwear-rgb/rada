"use server";

import { getCloudinary } from "./client";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  type CloudinaryDeleteResult,
  type CloudinaryUploadResult,
} from "./types";

const UPLOAD_FOLDER = "lago/products";

// Server Action de subida (Sprint 15): recibe un FormData con un único campo
// "file" (un objeto File, como lo arma product-image-manager.tsx al recibir
// un drop o una selección de archivos). La validación de tipo/tamaño se hace
// acá server-side aunque el cliente ya valide lo mismo antes de llamar —
// nunca hay que confiar solo en la validación del navegador.
export async function uploadProductImageAction(
  formData: FormData,
): Promise<CloudinaryUploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No se recibió ningún archivo." };
  }
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
    )
  ) {
    return {
      success: false,
      error: "Formato no admitido. Usá JPG, PNG, WEBP o GIF.",
    };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      success: false,
      error: "La imagen supera el tamaño máximo de 5 MB.",
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const cloudinary = getCloudinary();

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      width: number;
      height: number;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: UPLOAD_FOLDER, resource_type: "image" },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error("Cloudinary no devolvió resultado."));
            return;
          }
          resolve({
            secure_url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            width: uploadResult.width,
            height: uploadResult.height,
          });
        },
      );
      stream.end(buffer);
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error(
      "uploadProductImageAction: falló la subida a Cloudinary",
      error,
    );
    return {
      success: false,
      error: "No se pudo subir la imagen. Probá de nuevo en unos segundos.",
    };
  }
}

// Borrado best-effort: se llama tanto al reemplazar/quitar una imagen desde
// el formulario como al eliminar un producto completo. Un fallo acá no debe
// bloquear la operación principal (guardar el producto, o borrarlo) — se
// loguea y se devuelve el error, pero el llamador decide si le importa.
export async function deleteCloudinaryAssetAction(
  publicId: string,
): Promise<CloudinaryDeleteResult> {
  try {
    const cloudinary = getCloudinary();
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error(
      "deleteCloudinaryAssetAction: no se pudo borrar el asset",
      publicId,
      error,
    );
    return {
      success: false,
      error: "No se pudo borrar la imagen en Cloudinary.",
    };
  }
}
