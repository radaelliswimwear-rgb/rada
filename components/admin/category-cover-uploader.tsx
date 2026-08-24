"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { adminCategoriesRepository } from "lib/admin/categories-repository";
import { cloudinaryRepository } from "lib/cloudinary/cloudinary-repository";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "lib/cloudinary/types";
import {
  CONTAINER_ASPECT,
  getBackgroundFrame,
  getBackgroundPosition,
} from "lib/image-framing";
import type {
  AdminCategory,
  CategoryImageSlot,
} from "lib/admin/categories-actions";
import { CategoryImageFramer } from "./category-image-framer";

function isAllowedType(type: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

const SLOT_CONFIG: Record<
  CategoryImageSlot,
  {
    urlKey: "coverImageUrl" | "bannerImageUrl";
    publicIdKey: "coverImagePublicId" | "bannerImagePublicId";
    widthKey: "coverImageWidth" | "bannerImageWidth";
    heightKey: "coverImageHeight" | "bannerImageHeight";
    posXKey: "coverImagePosX" | "bannerImagePosX";
    posYKey: "coverImagePosY" | "bannerImagePosY";
    zoomKey: "coverImageZoom" | "bannerImageZoom";
    label: string;
    labelCapitalized: string;
  }
> = {
  cover: {
    urlKey: "coverImageUrl",
    publicIdKey: "coverImagePublicId",
    widthKey: "coverImageWidth",
    heightKey: "coverImageHeight",
    posXKey: "coverImagePosX",
    posYKey: "coverImagePosY",
    zoomKey: "coverImageZoom",
    label: "portada",
    labelCapitalized: "Portada",
  },
  banner: {
    urlKey: "bannerImageUrl",
    publicIdKey: "bannerImagePublicId",
    widthKey: "bannerImageWidth",
    heightKey: "bannerImageHeight",
    posXKey: "bannerImagePosX",
    posYKey: "bannerImagePosY",
    zoomKey: "bannerImageZoom",
    label: "banner",
    labelCapitalized: "Banner",
  },
};

// Subida de una imagen para un slot de categoría (portada del home o
// banner de colección — mismo mecanismo, distinto par de campos, ver
// lib/admin/categories-actions.ts). Mismo patrón de subida directa a
// Cloudinary que ProductImageManager, pero una sola imagen por fila.
export function CategoryCoverUploader({
  slot,
  category,
  onUpdated,
}: {
  slot: CategoryImageSlot;
  category: AdminCategory;
  onUpdated: (next: Partial<AdminCategory>) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isFraming, setIsFraming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = SLOT_CONFIG[slot];
  const currentUrl = category[config.urlKey];
  const currentPublicId = category[config.publicIdKey];
  const currentWidth = category[config.widthKey];
  const currentHeight = category[config.heightKey];
  const currentPosX = category[config.posXKey];
  const currentPosY = category[config.posYKey];
  const currentZoom = category[config.zoomKey];

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

    const previousPublicId = currentPublicId;
    const saveResult = await adminCategoriesRepository.updateImage(
      category.id,
      slot,
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

    onUpdated({
      [config.urlKey]: uploadResult.url,
      [config.publicIdKey]: uploadResult.publicId,
      [config.widthKey]: uploadResult.width,
      [config.heightKey]: uploadResult.height,
      [config.posXKey]: 50,
      [config.posYKey]: 50,
      [config.zoomKey]: 1,
    });
    toast(`${config.labelCapitalized} actualizada.`);
    if (previousPublicId) {
      await cloudinaryRepository.remove(previousPublicId);
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    const result = await adminCategoriesRepository.removeImage(
      category.id,
      slot,
    );
    setIsUploading(false);
    if (!result.success) {
      toast(result.error);
      return;
    }
    onUpdated({ [config.urlKey]: null, [config.publicIdKey]: null });
    toast(`${config.labelCapitalized} eliminada.`);
    if (currentPublicId) {
      await cloudinaryRepository.remove(currentPublicId);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {currentUrl && currentWidth && currentHeight ? (
        <div
          className="h-12 w-16 flex-none overflow-hidden rounded-md bg-neutral-100"
          style={{
            backgroundImage: `url(${currentUrl})`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: getBackgroundPosition(currentPosX, currentPosY),
            ...getBackgroundFrame(
              currentWidth,
              currentHeight,
              CONTAINER_ASPECT[slot],
              currentZoom,
            ),
          }}
        />
      ) : (
        <div className="h-12 w-16 flex-none rounded-md border border-dashed border-neutral-300 bg-neutral-50" />
      )}
      <div className="flex flex-col gap-1 text-xs">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="text-left font-medium text-black underline-offset-4 hover:underline disabled:opacity-50 dark:text-white"
        >
          {isUploading ? "Subiendo..." : currentUrl ? "Cambiar" : `Subir ${config.label}`}
        </button>
        {currentUrl && currentWidth && currentHeight ? (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => setIsFraming(true)}
            className="text-left text-neutral-500 underline-offset-4 hover:underline disabled:opacity-50"
          >
            Ajustar
          </button>
        ) : null}
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
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      {isFraming && currentUrl && currentWidth && currentHeight ? (
        <CategoryImageFramer
          slot={slot}
          categoryId={category.id}
          imageUrl={currentUrl}
          imageWidth={currentWidth}
          imageHeight={currentHeight}
          initialPosX={currentPosX}
          initialPosY={currentPosY}
          initialZoom={currentZoom}
          onClose={() => setIsFraming(false)}
          onSaved={(next) =>
            onUpdated({
              [config.posXKey]: next.posX,
              [config.posYKey]: next.posY,
              [config.zoomKey]: next.zoom,
            })
          }
        />
      ) : null}
    </div>
  );
}
