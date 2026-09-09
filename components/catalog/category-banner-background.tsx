"use client";

import { useEffect, useRef, useState } from "react";
import {
  CONTAINER_ASPECT,
  getBackgroundFrame,
  getBackgroundPosition,
} from "lib/image-framing";

// El banner de colección (a diferencia de la tarjeta del home, que sí tiene
// una relación de aspecto fija vía aspect-[3/4]) usa una altura responsive
// (h-[38vh]) sobre el ancho completo de la página — su relación de aspecto
// real varía según pantalla (angosta y alta en un celular, panorámica en
// desktop). getBackgroundFrame necesita la relación de aspecto REAL del
// contenedor para calcular bien el recorte "cover" (igual que el navegador
// necesitaría el tamaño real para background-size: cover) — asumir un
// valor fijo (como hace el editor del panel admin, que si tiene una caja de
// aspecto fijo) daba un recorte incorrecto en pantallas angostas: la foto
// se veía exagerada/mal encuadrada en celular (bug real reportado).
export function CategoryBannerBackground({
  imageUrl,
  imageWidth,
  imageHeight,
  posX,
  posY,
  zoom,
}: {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  posX: number;
  posY: number;
  zoom: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Arranca con el valor asumido (igual que antes) para no mostrar un
  // fondo en blanco durante el primer render/SSR — en cuanto el efecto
  // mide el tamaño real (mismo tick, antes de pintar en pantalla gracias a
  // useLayoutEffect-like timing del ResizeObserver inicial) lo corrige.
  const [containerAspect, setContainerAspect] = useState(CONTAINER_ASPECT.banner);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateAspect = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) setContainerAspect(width / height);
    };

    updateAspect();
    const observer = new ResizeObserver(updateAspect);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: getBackgroundPosition(posX, posY),
        ...getBackgroundFrame(imageWidth, imageHeight, containerAspect, zoom),
      }}
    />
  );
}
