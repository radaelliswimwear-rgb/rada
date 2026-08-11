"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { cloudinaryRepository } from "lib/cloudinary/cloudinary-repository";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "lib/cloudinary/types";
import type { AdminProductImage } from "lib/admin/types";

// Gestor de imágenes de producto (Sprint 15): reemplaza el textarea de URLs
// manuales del Sprint 14. Cada imagen se sube a Cloudinary apenas se suelta o
// selecciona (no recién al guardar el producto) para poder mostrar la
// miniatura real de inmediato; por eso quitar una imagen ya subida pero
// todavía no guardada en un producto también dispara el borrado en
// Cloudinary — si no, quedaría húérfana ahí.
function isAllowedType(type: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

type PendingImage = AdminProductImage & { isUploading?: boolean };

export function ProductImageManager({
  value,
  onChange,
}: {
  value: AdminProductImage[];
  onChange: (images: AdminProductImage[]) => void;
}) {
  const [images, setImages] = useState<PendingImage[]>(value);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  const emit = (next: PendingImage[]) => {
    setImages(next);
    onChange(next.map(({ isUploading: _isUploading, ...image }) => image));
  };

  const uploadFile = async (file: File): Promise<AdminProductImage | null> => {
    if (!isAllowedType(file.type)) {
      toast(`"${file.name}": formato no admitido (usá JPG, PNG, WEBP o GIF).`);
      return null;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast(`"${file.name}": supera el tamaño máximo de 50 MB.`);
      return null;
    }

    const formData = new FormData();
    formData.set("file", file);
    const result = await cloudinaryRepository.upload(formData);
    if (!result.success) {
      toast(`"${file.name}": ${result.error}`);
      return null;
    }
    return { url: result.url, publicId: result.publicId };
  };

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    const placeholders: PendingImage[] = list.map((file) => ({
      url: URL.createObjectURL(file),
      publicId: null,
      isUploading: true,
    }));
    const startIndex = images.length;
    emit([...images, ...placeholders]);

    const uploaded = await Promise.all(list.map(uploadFile));

    // No se llama a onChange() dentro del updater de setImages: React invoca
    // esa función de actualización en un momento en el que llamar al setState
    // de otro componente (ProductForm, vía la prop onChange) está prohibido
    // ("Cannot update a component while rendering a different component").
    // Por eso se computa afuera y se notifica al padre después.
    let cleaned: PendingImage[] = [];
    setImages((prev) => {
      const next = [...prev];
      uploaded.forEach((result, offset) => {
        const index = startIndex + offset;
        if (result) {
          next[index] = result;
        }
      });
      cleaned = next.filter((image) => !image.isUploading || image.publicId);
      return cleaned;
    });
    onChange(cleaned.map(({ isUploading: _isUploading, ...image }) => image));
  };

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) void addFiles(event.target.files);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    if (event.dataTransfer.files) void addFiles(event.dataTransfer.files);
  };

  const onRemove = async (index: number) => {
    const target = images[index];
    if (!target) return;
    const next = images.filter((_, i) => i !== index);
    emit(next);
    if (target.publicId) {
      await cloudinaryRepository.remove(target.publicId);
    }
  };

  const onMakeMain = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.unshift(item);
    emit(next);
  };

  const onMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const next = [...images];
    const a = next[index];
    const b = next[targetIndex];
    if (!a || !b) return;
    next[index] = b;
    next[targetIndex] = a;
    emit(next);
  };

  const onReplaceClick = (index: number) => {
    replaceIndexRef.current = index;
    replaceInputRef.current?.click();
  };

  const onReplaceFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const index = replaceIndexRef.current;
    event.target.value = "";
    if (!file || index === null) return;

    const previous = images[index];
    if (!previous) return;
    const next = [...images];
    next[index] = {
      url: URL.createObjectURL(file),
      publicId: null,
      isUploading: true,
    };
    emit(next);

    const result = await uploadFile(file);
    let updated: PendingImage[] = [];
    setImages((prev) => {
      updated = [...prev];
      updated[index] = result ?? previous;
      return updated;
    });
    onChange(updated.map(({ isUploading: _isUploading, ...image }) => image));

    if (result && previous.publicId) {
      await cloudinaryRepository.remove(previous.publicId);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm transition-colors duration-200 ${
          isDraggingOver
            ? "border-black bg-neutral-50 dark:border-white dark:bg-neutral-900"
            : "border-neutral-300 text-neutral-500 dark:border-neutral-700"
        }`}
      >
        <p>Arrastrá imágenes acá o hacé click para elegirlas</p>
        <p className="mt-1 text-xs text-neutral-400">
          JPG, PNG, WEBP o GIF · máx. 50 MB por imagen
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          multiple
          onChange={onFileInputChange}
          className="hidden"
        />
      </div>

      <input
        ref={replaceInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        onChange={onReplaceFileChange}
        className="hidden"
      />

      {images.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={`${image.publicId ?? image.url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800"
            >
              {/* <img> nativo a propósito: mientras sube, el preview es un
                  blob: URL local (URL.createObjectURL), que next/image no
                  puede servir (exige rutas locales o remotePatterns
                  http/https). El resto de la tienda (galería, catálogo,
                  home) sigue usando next/image sin cambios — acá es solo
                  una miniatura de edición, no la entrega optimizada al
                  visitante. */}
              <img
                src={image.url}
                alt={`Imagen ${index + 1}`}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity ${image.isUploading ? "opacity-50" : ""}`}
              />
              {index === 0 ? (
                <span className="absolute left-1 top-1 rounded bg-black px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white dark:bg-white dark:text-black">
                  Principal
                </span>
              ) : null}
              {image.isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-[11px] text-white">
                  Subiendo...
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onMove(index, -1)}
                      disabled={index === 0}
                      className="underline-offset-2 hover:underline disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(index, 1)}
                      disabled={index === images.length - 1}
                      className="underline-offset-2 hover:underline disabled:opacity-30"
                    >
                      →
                    </button>
                  </div>
                  {index !== 0 ? (
                    <button
                      type="button"
                      onClick={() => onMakeMain(index)}
                      className="underline-offset-2 hover:underline"
                    >
                      Hacer principal
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onReplaceClick(index)}
                    className="underline-offset-2 hover:underline"
                  >
                    Reemplazar
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-red-300 underline-offset-2 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
