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

// Visor de pantalla completa (Sprint 19): zoom con rueda/botones/clic,
// arrastre cuando está ampliado, pinch-to-zoom táctil, navegación
// con flechas y teclado, cierre con X/Escape/clic afuera. Fondo oscuro a
// propósito (look "premium" del visor) — no es el mismo criterio de
// paleta clara del resto de la tienda porque acá el objetivo es que la
// prenda sea lo único que se vea.
export function ProductLightbox({
  images,
  initialIndex,
  initialScale,
  onClose,
}: {
  images: LightboxImage[];
  initialIndex: number;
  // El clic en la foto principal de la galería (components/product/gallery.tsx)
  // ya mostraba la lupa de zoom en hover, pero abría el visor sin acercar —
  // había que además hacer doble clic adentro para recién ver el zoom. Se
  // abre directo con este acercamiento para que un solo clic sea suficiente.
  initialScale?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(initialScale ?? 1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  // Tamaño real (no el del contenedor) de cada foto — con object-contain,
  // una foto vertical dentro de un visor más ancho deja franjas oscuras a
  // los costados que técnicamente siguen siendo parte del elemento de la
  // imagen (fill ocupa el 100% del contenedor). Sin esto, el cursor de lupa
  // y el clic para acercar respondían en esas franjas vacías, no solo
  // sobre la prenda — se arma un recuadro con la proporción real de la
  // foto (max-width/max-height + aspect-ratio, mismo resultado visual que
  // object-contain) y SOLO ahí van el cursor y el clic.
  const [naturalSizes, setNaturalSizes] = useState<
    Record<string, { width: number; height: number }>
  >({});
  // El recuadro de la foto se calcula en píxeles (no con CSS aspect-ratio):
  // un <div> con aspect-ratio pero sin contenido que le dé tamaño (las
  // imágenes van con position:absolute, así que no cuentan para el tamaño
  // del padre) colapsa a 0x0 en vez de encogerse hasta el ancho o el alto
  // disponible como haría un <img> real con object-fit:contain. Mismo
  // criterio que CategoryBannerBackground: medir el contenedor real con
  // ResizeObserver y calcular el "contain" a mano.
  const viewerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
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
    const el = viewerRef.current;
    if (!el) return;
    const updateSize = () => {
      const { width, height } = el.getBoundingClientRect();
      setContainerSize({ width, height });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  // Antes esto era doble clic — quedaba raro porque el cursor de lupa en
  // hover (ver gallery.tsx) ya sugiere que un solo clic acerca. Ahora
  // cualquier clic sobre la foto (que no sea el final de un arrastre)
  // alterna entre acercada y normal — dragMovedRef distingue "clic" de
  // "arrastré para mover la foto ampliada", que también termina en un
  // mouseup/click pero no debe togglear el zoom.
  const MOVE_THRESHOLD = 6;
  const dragMovedRef = useRef(false);

  const toggleZoom = () => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  };

  const onImageClick = () => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    toggleZoom();
  };

  const onMouseDown = (event: React.MouseEvent) => {
    dragMovedRef.current = false;
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
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
      dragMovedRef.current = true;
    }
    setOffset({
      x: dragRef.current.offsetX + dx,
      y: dragRef.current.offsetY + dy,
    });
  };
  const stopDragging = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const onTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      // Sin esto, la transición CSS de 150ms (pensada para el "resorte" al
      // soltar) seguía activa durante el gesto: cada pequeño cambio de
      // escala/posición se animaba en vez de aplicarse al instante, así que
      // la foto iba "persiguiendo" al dedo en vez de seguirlo en tiempo
      // real — se sentía atascada. En mouse esto ya se apagaba bien
      // (onMouseDown), acá faltaba el equivalente para touch.
      setIsDragging(true);
      pinchRef.current = { distance: touchDistance(event.touches), scale };
    } else if (event.touches.length === 1 && scale > 1) {
      const touch = event.touches[0]!;
      setIsDragging(true);
      dragMovedRef.current = false;
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
      const dx = touch.clientX - dragRef.current.startX;
      const dy = touch.clientY - dragRef.current.startY;
      if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
        dragMovedRef.current = true;
      }
      setOffset({
        x: dragRef.current.offsetX + dx,
        y: dragRef.current.offsetY + dy,
      });
    }
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    if (event.touches.length < 2) pinchRef.current = null;
    if (event.touches.length === 0) {
      dragRef.current = null;
      setIsDragging(false);
    }
  };

  const image = images[index];
  const natural = image ? naturalSizes[image.src] : undefined;

  // Mismo cálculo de "contain" que lib/image-framing.ts (getBackgroundFrame),
  // pero devolviendo un ancho/alto en píxeles en vez de un background-size:
  // hasta no tener el tamaño real del contenedor Y de la foto, se usa el
  // contenedor completo (mismo comportamiento que antes, sin franja
  // detectada todavía).
  let frameWidth = containerSize.width;
  let frameHeight = containerSize.height;
  if (natural && containerSize.width > 0 && containerSize.height > 0) {
    const containerAspect = containerSize.width / containerSize.height;
    const imageAspect = natural.width / natural.height;
    if (imageAspect > containerAspect) {
      frameWidth = containerSize.width;
      frameHeight = containerSize.width / imageAspect;
    } else {
      frameHeight = containerSize.height;
      frameWidth = containerSize.height * imageAspect;
    }
  }

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
        ref={viewerRef}
        className="relative flex-1 touch-none select-none overflow-hidden"
        onWheel={onWheel}
        onMouseMove={onMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {image ? (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: isDragging ? "none" : "transform 150ms ease-out",
            }}
          >
            <div
              onClick={onImageClick}
              onMouseDown={onMouseDown}
              style={{
                position: "relative",
                width: frameWidth || "100%",
                height: frameHeight || "100%",
                cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
              }}
            >
              {/* Mismo criterio que components/product/gallery.tsx: las
                  fotos se piden TODAS de una vez (apiladas, solo la activa
                  visible) para que cambiar de imagen acá adentro sea
                  instantáneo en vez de esperar una nueva descarga cada vez —
                  el visor usa sizes="100vw" (más grande que la galería), así
                  que igual pediría de nuevo cada foto la primera vez que se
                  abre si solo precargáramos la de la galería. */}
              {images.map((img, i) => (
                <Image
                  key={img.src}
                  src={img.src}
                  alt={img.altText}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  style={{ opacity: i === index ? 1 : 0 }}
                  draggable={false}
                  priority
                  aria-hidden={i !== index}
                  onLoad={(event) => {
                    const target = event.currentTarget;
                    setNaturalSizes((prev) =>
                      prev[img.src]
                        ? prev
                        : {
                            ...prev,
                            [img.src]: {
                              width: target.naturalWidth,
                              height: target.naturalHeight,
                            },
                          },
                    );
                  }}
                />
              ))}
            </div>
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
