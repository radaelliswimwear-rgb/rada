"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type LightboxImage = { src: string; altText: string };

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const clampScale = (value: number) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

function touchDistance(touches: React.TouchList): number {
  const a = touches[0]!;
  const b = touches[1]!;
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

// Visor de pantalla completa (Sprint 19): zoom con rueda/botones/doble
// clic, arrastre cuando está ampliado, pinch-to-zoom táctil, navegación
// con flechas y teclado, cierre con X/Escape/clic afuera. Fondo oscuro a
// propósito (look "premium" del visor) — no es el mismo criterio de
// paleta clara del resto de la tienda porque acá el objetivo es que la
// prenda sea lo único que se vea.
export function ProductLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const goTo = useCallback(
    (next: number) => {
      setIndex((next + images.length) % images.length);
      resetZoom();
    },
    [images.length, resetZoom],
  );

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") goTo(index - 1);
      else if (event.key === "ArrowRight") goTo(index + 1);
      else if (event.key === "+" || event.key === "=")
        setScale((s) => clampScale(s + 0.5));
      else if (event.key === "-") setScale((s) => clampScale(s - 0.5));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, goTo, onClose]);

  const onWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    setScale((s) => clampScale(s + (event.deltaY < 0 ? 0.3 : -0.3)));
  };

  const onDoubleClick = () => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  };

  const onMouseDown = (event: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  };
  const onMouseMove = (event: React.MouseEvent) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.offsetX + (event.clientX - dragRef.current.startX),
      y: dragRef.current.offsetY + (event.clientY - dragRef.current.startY),
    });
  };
  const stopDragging = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const onTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      pinchRef.current = { distance: touchDistance(event.touches), scale };
    } else if (event.touches.length === 1 && scale > 1) {
      const touch = event.touches[0]!;
      dragRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        offsetX: offset.x,
        offsetY: offset.y,
      };
    }
  };
  const onTouchMove = (event: React.TouchEvent) => {
    if (event.touches.length === 2 && pinchRef.current) {
      const ratio = touchDistance(event.touches) / pinchRef.current.distance;
      setScale(clampScale(pinchRef.current.scale * ratio));
    } else if (event.touches.length === 1 && dragRef.current) {
      const touch = event.touches[0]!;
      setOffset({
        x: dragRef.current.offsetX + (touch.clientX - dragRef.current.startX),
        y: dragRef.current.offsetY + (touch.clientY - dragRef.current.startY),
      });
    }
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    if (event.touches.length < 2) pinchRef.current = null;
    if (event.touches.length === 0) dragRef.current = null;
  };

  const image = images[index];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-neutral-950/95"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de imágenes del producto"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white sm:px-6">
        <span className="text-sm text-white/70">
          Imagen {index + 1} de {images.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setScale((s) => clampScale(s - 0.5))}
            aria-label="Alejar imagen"
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <MagnifyingGlassMinusIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => clampScale(s + 0.5))}
            aria-label="Acercar imagen"
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <MagnifyingGlassPlusIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar visor"
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div
        className="relative flex-1 touch-none select-none overflow-hidden"
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {image ? (
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: isDragging ? "none" : "transform 150ms ease-out",
              cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
            }}
          >
            <Image
              src={image.src}
              alt={image.altText}
              fill
              sizes="100vw"
              className="object-contain"
              draggable={false}
              priority
            />
          </div>
        ) : null}

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Imagen anterior"
              className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-6"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Siguiente imagen"
              className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="flex justify-center gap-2 overflow-x-auto p-4">
          {images.map((thumbnail, thumbnailIndex) => (
            <button
              key={thumbnail.src}
              type="button"
              onClick={() => goTo(thumbnailIndex)}
              aria-label={`Ver imagen ${thumbnailIndex + 1}`}
              aria-current={thumbnailIndex === index}
              className={`relative h-14 w-14 flex-none overflow-hidden rounded-md border-2 transition-colors ${
                thumbnailIndex === index
                  ? "border-brand-coral"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={thumbnail.src}
                alt={thumbnail.altText}
                fill
                sizes="56px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
