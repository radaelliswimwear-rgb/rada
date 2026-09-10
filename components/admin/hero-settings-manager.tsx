"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { cloudinaryRepository } from "lib/cloudinary/cloudinary-repository";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
} from "lib/cloudinary/types";
import { optimizedVideoUrl } from "lib/cloudinary/video-url";
import { settingsRepository } from "lib/currency/settings-repository";
import type { HeroMedia, HeroText } from "lib/currency/settings-actions";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";
const labelClass =
  "mb-1.5 block text-xs uppercase tracking-[0.15em] text-neutral-500";
const MAX_VIDEO_MB = Math.round(MAX_VIDEO_BYTES / (1024 * 1024));

function isAllowedVideo(type: string): boolean {
  return (ALLOWED_VIDEO_TYPES as readonly string[]).includes(type);
}
function isAllowedImage(type: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

// Portada del home con video (Sprint 21): sube/quita el video en loop y su
// imagen de respaldo, y edita el texto superpuesto — todo en un solo
// componente porque las tres cosas arman una sola pieza de contenido
// (components/home/hero.tsx). Sin video subido, la portada sigue cayendo al
// diseño anterior de manchas pastel.
export function HeroSettingsManager({
  initialVideo,
  initialPoster,
  initialText,
}: {
  initialVideo: HeroMedia | null;
  initialPoster: HeroMedia | null;
  initialText: HeroText;
}) {
  const [video, setVideo] = useState(initialVideo);
  const [poster, setPoster] = useState(initialPoster);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  const [eyebrow, setEyebrow] = useState(initialText.eyebrow ?? "");
  const [headline, setHeadline] = useState(initialText.headline ?? "");
  const [subheadline, setSubheadline] = useState(initialText.subheadline ?? "");
  const [ctaLabel, setCtaLabel] = useState(initialText.ctaLabel ?? "");
  const [ctaHref, setCtaHref] = useState(initialText.ctaHref ?? "");
  const [isSavingText, setIsSavingText] = useState(false);

  const handleVideoFile = async (file: File) => {
    if (!isAllowedVideo(file.type)) {
      toast(`"${file.name}": formato no admitido (usá MP4, WebM o MOV).`);
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast(`"${file.name}": supera el tamaño máximo de ${MAX_VIDEO_MB} MB — usá un loop corto (5-10 segundos).`);
      return;
    }

    setIsUploadingVideo(true);
    const formData = new FormData();
    formData.set("file", file);
    const uploadResult = await cloudinaryRepository.uploadVideo(formData);
    if (!uploadResult.success) {
      setIsUploadingVideo(false);
      toast(`"${file.name}": ${uploadResult.error}`);
      return;
    }

    const previousPublicId = video?.publicId;
    const saveResult = await settingsRepository.updateHeroVideo(
      uploadResult.url,
      uploadResult.publicId,
    );
    setIsUploadingVideo(false);
    if (!saveResult.success) {
      toast(saveResult.error);
      await cloudinaryRepository.remove(uploadResult.publicId, "video");
      return;
    }

    setVideo({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      width: uploadResult.width,
      height: uploadResult.height,
    });
    toast("Video de portada actualizado.");
    if (previousPublicId) {
      await cloudinaryRepository.remove(previousPublicId, "video");
    }
  };

  const handleRemoveVideo = async () => {
    setIsUploadingVideo(true);
    const result = await settingsRepository.removeHeroVideo();
    setIsUploadingVideo(false);
    if (!result.success) {
      toast(result.error);
      return;
    }
    const previousPublicId = video?.publicId;
    setVideo(null);
    toast("Video de portada eliminado — la portada vuelve al diseño anterior.");
    if (previousPublicId) {
      await cloudinaryRepository.remove(previousPublicId, "video");
    }
  };

  const handlePosterFile = async (file: File) => {
    if (!isAllowedImage(file.type)) {
      toast(`"${file.name}": formato no admitido (usá JPG, PNG, WEBP o GIF).`);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast(`"${file.name}": supera el tamaño máximo de 50 MB.`);
      return;
    }

    setIsUploadingPoster(true);
    const formData = new FormData();
    formData.set("file", file);
    const uploadResult = await cloudinaryRepository.upload(formData);
    if (!uploadResult.success) {
      setIsUploadingPoster(false);
      toast(`"${file.name}": ${uploadResult.error}`);
      return;
    }

    const previousPublicId = poster?.publicId;
    const saveResult = await settingsRepository.updateHeroPoster(
      uploadResult.url,
      uploadResult.publicId,
      uploadResult.width,
      uploadResult.height,
    );
    setIsUploadingPoster(false);
    if (!saveResult.success) {
      toast(saveResult.error);
      await cloudinaryRepository.remove(uploadResult.publicId);
      return;
    }

    setPoster({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      width: uploadResult.width,
      height: uploadResult.height,
    });
    toast("Imagen de respaldo actualizada.");
    if (previousPublicId) {
      await cloudinaryRepository.remove(previousPublicId);
    }
  };

  const handleRemovePoster = async () => {
    setIsUploadingPoster(true);
    const result = await settingsRepository.removeHeroPoster();
    setIsUploadingPoster(false);
    if (!result.success) {
      toast(result.error);
      return;
    }
    const previousPublicId = poster?.publicId;
    setPoster(null);
    toast("Imagen de respaldo eliminada.");
    if (previousPublicId) {
      await cloudinaryRepository.remove(previousPublicId);
    }
  };

  const onSubmitText = async (event: FormEvent) => {
    event.preventDefault();
    setIsSavingText(true);
    const result = await settingsRepository.updateHeroText({
      eyebrow,
      headline,
      subheadline,
      ctaLabel,
      ctaHref,
    });
    setIsSavingText(false);
    if (!result.success) {
      toast(result.error);
      return;
    }
    toast("Texto de portada guardado.");
  };

  return (
    <div className="space-y-6">
      <div>
        <p className={labelClass}>
          Video (MP4, WebM o MOV · máx. {MAX_VIDEO_MB} MB)
        </p>
        <p className="mb-3 text-xs text-neutral-500">
          Recomendado: loop de 8 a 12 segundos, sin audio (no se reproduce
          igual, va silenciado), idealmente menos de 5 MB — Cloudinary lo
          optimiza solo al servirlo, así que no hace falta comprimirlo a
          mano, pero un archivo más liviano carga más rápido para la
          clienta.
        </p>
        <div className="flex items-center gap-4">
          {video ? (
            <video
              src={optimizedVideoUrl(video.url)}
              className="h-24 w-40 flex-none rounded-md border border-neutral-200 object-cover"
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <div className="h-24 w-40 flex-none rounded-md border border-dashed border-neutral-300 bg-neutral-50" />
          )}
          <div className="flex flex-col gap-1 text-xs">
            <button
              type="button"
              disabled={isUploadingVideo}
              onClick={() => videoInputRef.current?.click()}
              className="text-left font-medium text-black underline-offset-4 hover:underline disabled:opacity-50 dark:text-white"
            >
              {isUploadingVideo ? "Subiendo..." : video ? "Cambiar video" : "Subir video"}
            </button>
            {video ? (
              <button
                type="button"
                disabled={isUploadingVideo}
                onClick={handleRemoveVideo}
                className="text-left text-neutral-500 underline-offset-4 hover:underline disabled:opacity-50"
              >
                Quitar (vuelve al diseño anterior)
              </button>
            ) : null}
          </div>
          <input
            ref={videoInputRef}
            type="file"
            accept={ALLOWED_VIDEO_TYPES.join(",")}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void handleVideoFile(file);
            }}
          />
        </div>
      </div>

      <div>
        <p className={labelClass}>
          Imagen de respaldo (opcional — se ve mientras el video carga)
        </p>
        <div className="flex items-center gap-4">
          {poster ? (
            <div className="relative h-24 w-20 flex-none overflow-hidden rounded-md border border-neutral-200">
              <Image
                src={poster.url}
                alt="Imagen de respaldo de la portada"
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
              disabled={isUploadingPoster}
              onClick={() => posterInputRef.current?.click()}
              className="text-left font-medium text-black underline-offset-4 hover:underline disabled:opacity-50 dark:text-white"
            >
              {isUploadingPoster ? "Subiendo..." : poster ? "Cambiar imagen" : "Subir imagen"}
            </button>
            {poster ? (
              <button
                type="button"
                disabled={isUploadingPoster}
                onClick={handleRemovePoster}
                className="text-left text-neutral-500 underline-offset-4 hover:underline disabled:opacity-50"
              >
                Quitar
              </button>
            ) : null}
          </div>
          <input
            ref={posterInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void handlePosterFile(file);
            }}
          />
        </div>
      </div>

      <form
        onSubmit={onSubmitText}
        className="grid gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
      >
        <div>
          <label htmlFor="heroEyebrow" className={labelClass}>
            Texto pequeño de arriba
          </label>
          <input
            id="heroEyebrow"
            value={eyebrow}
            onChange={(e) => setEyebrow(e.target.value)}
            placeholder="Radaelli Swimwear"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="heroHeadline" className={labelClass}>
            Título grande
          </label>
          <input
            id="heroHeadline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Diseños que acompañan tu belleza natural con fuerza, libertad y estilo."
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="heroSubheadline" className={labelClass}>
            Subtítulo
          </label>
          <input
            id="heroSubheadline"
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
            placeholder="Swimwear pensado para mujeres auténticas, seguras y poderosas."
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="heroCtaLabel" className={labelClass}>
              Texto del botón
            </label>
            <input
              id="heroCtaLabel"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="Compra de forma sostenible"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="heroCtaHref" className={labelClass}>
              Enlace del botón
            </label>
            <input
              id="heroCtaHref"
              value={ctaHref}
              onChange={(e) => setCtaHref(e.target.value)}
              placeholder="/oasis-natural o #productos"
              className={inputClass}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isSavingText}
          className="w-fit rounded-full bg-black px-6 py-2.5 text-sm font-medium tracking-wide text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {isSavingText ? "Guardando..." : "Guardar texto de portada"}
        </button>
        <p className="text-xs text-neutral-500">
          Dejá un campo vacío para usar el texto de marca por defecto.
        </p>
      </form>
    </div>
  );
}
