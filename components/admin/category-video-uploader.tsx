"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { adminCategoriesRepository } from "lib/admin/categories-repository";
import { cloudinaryRepository } from "lib/cloudinary/cloudinary-repository";
import { ALLOWED_VIDEO_TYPES, MAX_VIDEO_BYTES } from "lib/cloudinary/types";
import { optimizedVideoUrl } from "lib/cloudinary/video-url";
import type { AdminCategory } from "lib/admin/categories-actions";

const MAX_VIDEO_MB = Math.round(MAX_VIDEO_BYTES / (1024 * 1024));

function isAllowedVideo(type: string): boolean {
  return (ALLOWED_VIDEO_TYPES as readonly string[]).includes(type);
}

// Video en loop opcional para la tarjeta de categoría del home (Sprint 22):
// mismo mecanismo que HeroSettingsManager, pero por categoría y sin imagen
// de respaldo propia — la portada (CategoryCoverUploader, slot "cover") ya
// cumple ese rol como poster mientras el video carga o si se lo quita.
export function CategoryVideoUploader({
  category,
  onUpdated,
}: {
  category: AdminCategory;
  onUpdated: (next: Partial<AdminCategory>) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUrl = category.coverVideoUrl;
  const currentPublicId = category.coverVideoPublicId;

  const handleFile = async (file: File) => {
    if (!isAllowedVideo(file.type)) {
      toast(`"${file.name}": formato no admitido (usá MP4, WebM o MOV).`);
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast(
        `"${file.name}": supera el tamaño máximo de ${MAX_VIDEO_MB} MB — usá un loop corto (4-6 segundos).`,
      );
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const uploadResult = await cloudinaryRepository.uploadCategoryVideo(formData);
    if (!uploadResult.success) {
      setIsUploading(false);
      toast(`"${file.name}": ${uploadResult.error}`);
      return;
    }

    const previousPublicId = currentPublicId;
    const saveResult = await adminCategoriesRepository.updateVideo(
      category.id,
      uploadResult.url,
      uploadResult.publicId,
    );
    setIsUploading(false);
    if (!saveResult.success) {
      toast(saveResult.error);
      await cloudinaryRepository.remove(uploadResult.publicId, "video");
      return;
    }

    onUpdated({
      coverVideoUrl: uploadResult.url,
      coverVideoPublicId: uploadResult.publicId,
    });
    toast("Video de categoría actualizado.");
    if (previousPublicId) {
      await cloudinaryRepository.remove(previousPublicId, "video");
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    const result = await adminCategoriesRepository.removeVideo(category.id);
    setIsUploading(false);
    if (!result.success) {
      toast(result.error);
      return;
    }
    onUpdated({ coverVideoUrl: null, coverVideoPublicId: null });
    toast("Video eliminado — la tarjeta vuelve a mostrar la foto fija.");
    if (currentPublicId) {
      await cloudinaryRepository.remove(currentPublicId, "video");
    }
  };

  return (
    <div className="flex items-center gap-3">
      {currentUrl ? (
        <video
          src={optimizedVideoUrl(currentUrl)}
          className="h-12 w-20 flex-none rounded-md border border-neutral-200 object-cover"
          muted
          loop
          autoPlay
          playsInline
        />
      ) : (
        <div className="h-12 w-20 flex-none rounded-md border border-dashed border-neutral-300 bg-neutral-50" />
      )}
      <div className="flex flex-col gap-1 text-xs">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="text-left font-medium text-black underline-offset-4 hover:underline disabled:opacity-50 dark:text-white"
        >
          {isUploading ? "Subiendo..." : currentUrl ? "Cambiar" : "Subir video"}
        </button>
        {currentUrl ? (
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
        accept={ALLOWED_VIDEO_TYPES.join(",")}
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
