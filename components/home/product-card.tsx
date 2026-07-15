import Image from "next/image";
import Link from "next/link";
import type { PlaceholderProduct } from "lib/placeholder-data";

export function ProductCard({ product }: { product: PlaceholderProduct }) {
  return (
    <div className="group">
      <Link
        href={`/producto/${product.slug}`}
        className="relative block aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900"
      >
        <Image
          src={product.images[0]!}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-end justify-center bg-black/0 pb-4 opacity-0 transition-all duration-300 group-hover:bg-black/20 group-hover:opacity-100">
          <span className="translate-y-2 rounded-full bg-white px-5 py-2 text-xs font-medium uppercase tracking-wide text-black transition-transform duration-300 group-hover:translate-y-0">
            Ver producto
          </span>
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] uppercase tracking-wide text-black dark:bg-black/80 dark:text-white">
          {product.category}
        </span>
      </Link>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-sm text-neutral-800 dark:text-neutral-200">
          {product.name}
        </h3>
        <span className="whitespace-nowrap text-sm font-medium text-black dark:text-white">
          {product.price} €
        </span>
      </div>
    </div>
  );
}
