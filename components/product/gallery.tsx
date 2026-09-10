"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { GridTileImage } from "components/grid/tile";
import { ProductLightbox } from "components/product-detail/product-lightbox";
import Image from "next/image";
import { useRef, useState } from "react";

export function Gallery({
  images,
}: {
  images: { src: string; altText: string }[];
}) {
  // Antes el índice de la imagen activa vivía en el query string
  // (?image=N) y se actualizaba con router.replace(). En el App Router,
  // eso dispara un viaje al servidor (re-ejecuta la carga de datos de toda
  // la página: relacionados, vistas, etc.) solo para cambiar qué foto se
  // ve — de ahí la demora al cambiar de miniatura, no el peso de la
  // imagen. Es puramente estado visual del cliente, así que va en
  // useState, sin tocar el servidor.
  const [imageIndex, setImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const wasSwipeRef = useRef(false);

  const updateImage = (index: string) => {
    setImageIndex(Number(index));
  };

  const nextImageIndex = imageIndex + 1 < images.length ? imageIndex + 1 : 0;
  const previousImageIndex =
    imageIndex === 0 ? images.length - 1 : imageIndex - 1;
  const currentImage = images[imageIndex];

  // En celular no hay miniaturas (se ocultan, ver más abajo) — la
  // navegación es deslizar el dedo sobre la foto, como en las fichas de
  // producto de Touché/Cupshe/etc. Se compara el desplazamiento horizontal
  // vs. vertical para no interferir con el scroll normal de la página, y
  // se marca wasSwipeRef para que el "tap" que dispara el swipe no abra
  // también el visor de pantalla completa (el onClick del contenedor).
  const SWIPE_THRESHOLD = 40;
  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || images.length < 2) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    wasSwipeRef.current = true;
    updateImage(
      (dx < 0 ? nextImageIndex : previousImageIndex).toString(),
    );
  };

  // Zoom tipo lupa en escritorio: solo actualiza un par de números en
  // cada mousemove (posición %) y deja que el navegador haga el trabajo
  // pesado vía CSS background-position — no recalcula ni re-renderiza la
  // imagen entera, así que no pega en el rendimiento. Se desactiva en
  // touch (pointer: coarse) porque ahí el gesto es pinch-to-zoom, no hover.
  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const rect = imageWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setMagnifierPosition({ x, y });
  };

  return (
    <>
      <form>
        <div
          ref={imageWrapRef}
          className="relative aspect-square h-full max-h-[550px] w-full cursor-zoom-in touch-pan-y overflow-hidden lg:max-h-[640px]"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onMouseMove={onMouseMove}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={() => {
            if (wasSwipeRef.current) {
              wasSwipeRef.current = false;
              return;
            }
            setIsLightboxOpen(true);
          }}
          role="button"
          tabIndex={0}
          aria-label="Abrir visor de imágenes en pantalla completa"
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setIsLightboxOpen(true);
            }
          }}
        >
          {/* Las fotos se piden TODAS apenas se abre la ficha (quedan
              montadas y apiladas exactamente una encima de otra, solo se
              muestra/oculta con opacity la que está activa) en vez de solo
              la actual — antes, al cambiar de miniatura, el navegador recién
              ahí pedía esa foto por primera vez y esperaba la respuesta
              completa (varios segundos en una red real, no en localhost).
              Con todas precargadas de entrada, cambiar de foto es
              instantáneo: ya está en la caché del navegador. */}
          {images.map((image, index) => (
            <Image
              key={image.src}
              className="absolute inset-0 h-full w-full object-contain transition-opacity duration-150"
              style={{
                opacity: index === imageIndex ? 1 : 0,
                pointerEvents: index === imageIndex ? "auto" : "none",
              }}
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              alt={image.altText}
              src={image.src}
              priority
              aria-hidden={index !== imageIndex}
            />
          ))}

          {currentImage && isHovering ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 hidden bg-no-repeat lg:block"
              style={{
                backgroundImage: `url(${currentImage.src})`,
                backgroundSize: "220%",
                backgroundPosition: `${magnifierPosition.x}% ${magnifierPosition.y}%`,
              }}
            />
          ) : null}

          {images.length > 1 ? (
            <span className="absolute left-4 top-4 hidden rounded-full bg-black/60 px-3 py-1 text-xs text-white lg:block">
              Imagen {imageIndex + 1} de {images.length}
            </span>
          ) : null}

          {images.length > 1 ? (
            <div className="absolute bottom-[15%] hidden w-full justify-center lg:flex">
              <div className="mx-auto flex h-11 items-center rounded-full border border-white bg-neutral-50/80 text-neutral-500 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    updateImage(previousImageIndex.toString());
                  }}
                  aria-label="Previous product image"
                  className="flex h-full items-center justify-center px-6 transition-all ease-in-out hover:scale-110 hover:text-black"
                >
                  <ArrowLeftIcon className="h-5" />
                </button>
                <div className="mx-1 h-6 w-px bg-neutral-500"></div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    updateImage(nextImageIndex.toString());
                  }}
                  aria-label="Next product image"
                  className="flex h-full items-center justify-center px-6 transition-all ease-in-out hover:scale-110 hover:text-black"
                >
                  <ArrowRightIcon className="h-5" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Puntos indicadores en celular: van AFUERA de la foto, sobre el
            fondo blanco de la página, no encima de la imagen — puestos
            sobre la foto se perdían de vista en prendas con fondo claro
            (blanco/beige/pastel, muy comunes en el catálogo), y la clienta
            podía pensar que solo había una foto. Así siempre contrastan,
            sin importar el fondo de la foto. */}
        {images.length > 1 ? (
          <div className="flex items-center justify-center gap-1.5 pt-3 lg:hidden">
            {images.map((image, index) => (
              <span
                key={image.src}
                aria-hidden="true"
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === imageIndex
                    ? "w-5 bg-neutral-900"
                    : "w-1.5 bg-neutral-300"
                }`}
              />
            ))}
          </div>
        ) : null}

        {/* Miniaturas más grandes y solo en desktop (protagonismo de la
            prenda pedido explícitamente) — en celular no aportan nada que
            el deslizar + los puntos no cubran ya, y solo restan espacio a
            la foto principal. */}
        {images.length > 1 ? (
          <ul className="my-8 hidden flex-wrap items-center justify-center gap-3 py-1 lg:flex">
            {images.map((image, index) => {
              const isActive = index === imageIndex;

              return (
                <li key={image.src} className="h-28 w-28">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      updateImage(index.toString());
                    }}
                    aria-label={`Ver imagen ${index + 1} de ${images.length}`}
                    aria-current={isActive}
                    className="h-full w-full"
                  >
                    <GridTileImage
                      alt={image.altText}
                      src={image.src}
                      width={112}
                      height={112}
                      active={isActive}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </form>

      {isLightboxOpen ? (
        <ProductLightbox
          images={images}
          initialIndex={imageIndex}
          // Un clic en la foto ya alcanza para ver el acercamiento — antes
          // el visor abría sin zoom y hacía falta un doble clic adentro
          // para recién acercar, aunque el cursor de lupa en hover ya
          // insinuaba que un clic iba a hacerlo.
          initialScale={2.5}
          onClose={() => setIsLightboxOpen(false)}
        />
      ) : null}
    </>
  );
}
