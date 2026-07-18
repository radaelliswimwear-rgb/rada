import clsx from "clsx";
import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const arrowClass = (disabled: boolean) =>
    clsx(
      "flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-colors duration-200",
      disabled
        ? "pointer-events-none border-neutral-200 text-neutral-300"
        : "border-neutral-300 text-neutral-900 hover:border-brand-crimson hover:text-brand-crimson",
    );

  return (
    <nav aria-label="Paginación" className="mt-12 flex items-center justify-center gap-2">
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={arrowClass(currentPage === 1)}
      >
        ←
      </Link>
      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={clsx(
            "flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors duration-200",
            page === currentPage
              ? "bg-brand-crimson text-white"
              : "text-neutral-600 hover:bg-neutral-100",
          )}
        >
          {page}
        </Link>
      ))}
      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={arrowClass(currentPage === totalPages)}
      >
        →
      </Link>
    </nav>
  );
}
