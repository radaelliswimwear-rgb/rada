"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { toast } from "sonner";
import { adminCategoriesRepository } from "lib/admin/categories-repository";
import {
  CONTAINER_ASPECT,
  getBackgroundFrame,
  getBackgroundPosition,
} from "lib/image-framing";
import type { CategoryImageSlot } from "lib/admin/categories-actions";

const ASPECT_CLASS_BY_SLOT: Record<CategoryImageSlot, string> = {
  cover: "aspect-[3/4]",
  banner: "aspect-[12/5]",
};

const LABEL_BY_SLOT: Record<CategoryImageSlot, string> = {
  cover: "portada (home)",
  banner: "banner de colección",
};

const NUDGE_STEP = 8;
const arrowButtonClass =
  "flex h-6 w-6 items-center justify-center rounded bg-black/60 text-xs text-white hover:bg-black/80";

// Editor de encuadre sin re-subir el archivo (Cloudinary ya tiene la foto
// final). Usa background-image + background-size/background-position, NO
// <img> con object-fit/object-position + transform:scale — esa combinación
// tiene un bug real: el navegador decide el recorte de object-fit ANTES de
// aplicar el transform, así que el zoom solo amplía lo ya recortado y
// mover la posición nunca revela contenido nuevo de la imagen (confirmado
// con una prueba CSS aislada, sin componentes de React, durante el
// desarrollo). background-size/position no tienen ese problema: el
// navegador los resuelve juntos. Ver lib/image-framing.ts.
export function CategoryImageFramer({
  slot,
  categoryId,
  imageUrl,
  imageWidth,
  imageHeight,
  initialPosX,
  initialPosY,
  initialZoom,
  onClose,
  onSaved,
}: {
  slot: CategoryImageSlot;
  categoryId: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  initialPosX: number;
  initialPosY: number;
  initialZoom: number;
  onClose: () => void;
  onSaved: (next: { posX: number; posY: number; zoom: number }) => void;
}) {
  const [posX, setPosX] = useState(initialPosX);
  const [posY, setPosY] = useState(initialPosY);
  const [zoom, setZoom] = useState(initialZoom);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  const containerAspect = CONTAINER_ASPECT[slot];
  const imageAspect = imageWidth / imageHeight;

  // Cuánto "sobra" del fondo (ya escalado por zoom) más allá del
  // contenedor, en píxeles — el rango real que background-position puede
  // recorrer. Si es 0 (el eje no desborda), ese eje queda fijo en el
  // centro. Se calcula a partir de porcentajes puros (independientes del
  // tamaño real en píxeles) más el tamaño medido del contenedor, así que
  // es responsive sin necesitar medir la imagen (ya tenemos su relación de
  // aspecto real desde Cloudinary).
  const getOverflowPx = () => {
    const container = containerRef.current;
    if (!container) return null;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    const { backgroundSize } = getBackgroundFrame(
      imageWidth,
      imageHeight,
      containerAspect,
      zoomRef.current,
    );
    const parts = backgroundSize.split(" ").map((v) => parseFloat(v));
    const wPercent = parts[0] ?? 100;
    const hPercent = parts[1] ?? 100;
    return {
      overflowX: Math.max(0, containerW * (wPercent / 100 - 1)),
      overflowY: Math.max(0, containerH * (hPercent / 100 - 1)),
    };
  };

  // dxPhoto/dyPhoto: hacia dónde se ve que se mueve la FOTO bajo el cursor.
  // background-position va al revés de eso (subir posX recorta más del
  // lado derecho de la imagen, o sea la foto "se corre" a la izquierda).
  const applyPhotoDelta = (dxPhoto: number, dyPhoto: number) => {
    const overflow = getOverflowPx();
    if (!overflow) return;
    setPosX((prev) =>
      overflow.overflowX <= 0
        ? 50
        : Math.min(100, Math.max(0, prev - dxPhoto)),
    );
    setPosY((prev) =>
      overflow.overflowY <= 0
        ? 50
        : Math.min(100, Math.max(0, prev - dyPhoto)),
    );
  };

  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startPosX: posX,
      startPosY: posY,
    };
    setIsDragging(true);
  };

  // Listeners de window instalados una única vez al montar (no atados a
  // isDragging) para evitar cualquier carrera entre "empezó el drag" y
  // "React todavía no instaló el listener". El gate real es dragStateRef,
  // leído de forma síncrona en cada evento.
  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const overflow = getOverflowPx();
      if (!overflow) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;

      const nextPosX =
        overflow.overflowX <= 0
          ? 50
          : drag.startPosX - (dx / overflow.overflowX) * 100;
      const nextPosY =
        overflow.overflowY <= 0
          ? 50
          : drag.startPosY - (dy / overflow.overflowY) * 100;

      setPosX(Math.min(100, Math.max(0, nextPosX)));
      setPosY(Math.min(100, Math.max(0, nextPosY)));
    };

    const onMouseUp = () => {
      if (!dragStateRef.current) return;
      dragStateRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a propósito
    // solo al montar/desmontar; getOverflowPx lee zoomRef (no state), no
    // hace falta reinstalar nada cuando cambian posX/posY/zoom.
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await adminCategoriesRepository.updateImageFraming(
      categoryId,
      slot,
      posX,
      posY,
      zoom,
    );
    setIsSaving(false);
    if (!result.success) {
      toast(result.error);
      return;
    }
    onSaved({ posX, posY, zoom });
    toast("Encuadre guardado.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 dark:bg-neutral-900">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Ajustar {LABEL_BY_SLOT[slot]}
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          Usá los controles de abajo (zoom, mover horizontal, mover
          vertical). También podés arrastrar la foto directamente o usar las
          flechas si te resulta más cómodo.
        </p>

        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          className={`relative mt-4 w-full select-none overflow-hidden rounded-xl bg-neutral-100 ${ASPECT_CLASS_BY_SLOT[slot]}`}
          style={{
            cursor: isDragging ? "grabbing" : "grab",
            backgroundImage: `url(${imageUrl})`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: getBackgroundPosition(posX, posY),
            ...getBackgroundFrame(imageWidth, imageHeight, containerAspect, zoom),
          }}
        >
          {/* Flechas: mismo movimiento que arrastrar, para cuando no es
              obvio (o no funciona en el dispositivo) que la foto se puede
              tomar con el mouse. */}
          <div
            onMouseDown={(event) => event.stopPropagation()}
            className="absolute bottom-2 right-2 grid grid-cols-3 grid-rows-3 gap-0.5"
          >
            <span />
            <button
              type="button"
              aria-label="Mover arriba"
              onClick={() => applyPhotoDelta(0, -NUDGE_STEP)}
              className={arrowButtonClass}
            >
              ↑
            </button>
            <span />
            <button
              type="button"
              aria-label="Mover a la izquierda"
              onClick={() => applyPhotoDelta(-NUDGE_STEP, 0)}
              className={arrowButtonClass}
            >
              ←
            </button>
            <span />
            <button
              type="button"
              aria-label="Mover a la derecha"
              onClick={() => applyPhotoDelta(NUDGE_STEP, 0)}
              className={arrowButtonClass}
            >
              →
            </button>
            <span />
            <button
              type="button"
              aria-label="Mover abajo"
              onClick={() => applyPhotoDelta(0, NUDGE_STEP)}
              className={arrowButtonClass}
            >
              ↓
            </button>
            <span />
          </div>
        </div>

        <label className="mt-4 block text-xs text-neutral-500">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="mt-1 w-full"
          />
        </label>

        <label className="mt-3 block text-xs text-neutral-500">
          Mover horizontal
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={posX}
            onChange={(event) => setPosX(Number(event.target.value))}
            className="mt-1 w-full"
          />
        </label>

        <label className="mt-3 block text-xs text-neutral-500">
          Mover vertical
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={posY}
            onChange={(event) => setPosY(Number(event.target.value))}
            className="mt-1 w-full"
          />
        </label>

        <div className="mt-5 flex justify-end gap-3 text-sm">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-neutral-500 hover:text-black disabled:opacity-50 dark:hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full bg-black px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
