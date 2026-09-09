"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { settingsRepository } from "lib/currency/settings-repository";
import type { SizeGuideImage } from "lib/currency/settings-actions";
import { cloudinaryRepository } from "lib/cloudinary/cloudinary-repository";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "lib/cloudinary/types";

function isAllowedType(type: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

// Imagen única para toda la tienda, sin framing/zoom (a diferencia de
// CategoryCoverUploader): es una tabla de referencia que se muestra
// completa en el modal del cliente, no una foto de moda que haga falta
// recortar. Mismo mecanismo de subida directa a Cloudinary.
export function SizeGuideUploader({
  initial,
}: {
  initial: SizeGuideImage | null;
}) {
  const [image, setImage] = useState(initial);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!isAllowedType(file.type)) {
      toast(`"${file.name}": formato no admitido (usá JPG, PNG, WEBP o GIF).`);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast(`"${file.name}": supera el tamaño máximo de 50 MB.`);
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const uploadResult = await cloudinaryRepository.upload(formData);
    if (!uploadResult.success) {
      setIsUploading(false);
      toast(`"${file.name}": ${uploadResult.error}`);
      return;
    }

    const previousPublicId = image?.publicId;
    const saveResult = await settingsRepository.updateSizeGuideImage(
      uploadResult.url,
      uploadResult.publicId,
      uploadResult.width,
      uploadResult.height,
    );
    setIsUploading(false);
    if (!saveResult.success) {
      toast(saveResult.error);
      await cloudinaryRepository.remove(uploadResult.publicId);
      return;
    }

    setImage({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      width: uploadResult.width,
      height: uploadResult.height,
    });
    toast("Guía de tallas actualizada.");
    if (previousPublicId) {
      await cloudinaryRepository.remove(previousPublicId);
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    const result = await settingsRepository.removeSizeGuideImage();
    setIsUploading(false);
    if (!result.success) {
      toast(result.error);
      return;
    }
    const previousPublicId = image?.publicId;
    setImage(null);
    toast("Guía de tallas eliminada.");
    if (previousPublicId) {
      await cloudinaryRepository.remove(previousPublicId);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {image ? (
        <div className="relative h-24 w-20 flex-none overflow-hidden rounded-md border border-neutral-200">
          <Image
            src={image.url}
            alt="Guía de tallas"
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-24 w-20 flex-none rounded-md border border-dashed border-neutral-300 bg-neutral-50" />
      )}
      <div className="flex flex-col gap-1 text-xs">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="text-left font-medium text-black underline-offset-4 hover:underline disabled:opacity-50 dark:text-white"
        >
          {isUploading ? "Subiendo..." : image ? "Cambiar imagen" : "Subir guía de tallas"}
        </button>
        {image ? (
          <button
            type="button"
            disabled={isUploading}
            onClick={handleRemove}
            className="text-left text-neutral-500 underline-offset-4 hover:underline disabled:opacity-50"
          >
            Quitar
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
