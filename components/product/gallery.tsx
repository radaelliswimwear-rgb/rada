"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { GridTileImage } from "components/grid/tile";
import { ProductLightbox } from "components/product-detail/product-lightbox";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export function Gallery({
  images,
}: {
  images: { src: string; altText: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageIndex = searchParams.has("image")
    ? parseInt(searchParams.get("image")!)
    : 0;
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const imageWrapRef = useRef<HTMLDivElement>(null);

  const updateImage = (index: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("image", index);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const nextImageIndex = imageIndex + 1 < images.length ? imageIndex + 1 : 0;
  const previousImageIndex =
    imageIndex === 0 ? images.length - 1 : imageIndex - 1;
  const currentImage = images[imageIndex];

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
          className="relative aspect-square h-full max-h-[550px] w-full cursor-zoom-in overflow-hidden"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onMouseMove={onMouseMove}
          onClick={() => setIsLightboxOpen(true)}
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
          {currentImage && (
            <Image
              className="h-full w-full object-contain"
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              alt={currentImage.altText}
              src={currentImage.src}
              priority={true}
            />
          )}

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
            <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              Imagen {imageIndex + 1} de {images.length}
            </span>
          ) : null}

          {images.length > 1 ? (
            <div className="absolute bottom-[15%] flex w-full justify-center">
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

        {images.length > 1 ? (
          <ul className="my-12 flex items-center flex-wrap justify-center gap-2 overflow-auto py-1 lg:mb-0">
            {images.map((image, index) => {
              const isActive = index === imageIndex;

              return (
                <li key={image.src} className="h-20 w-20">
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
                      width={80}
                      height={80}
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
          onClose={() => setIsLightboxOpen(false)}
        />
      ) : null}
    </>
  );
}
