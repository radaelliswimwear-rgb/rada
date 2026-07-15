export function CatalogSkeleton() {
  return (
    <>
      <div className="h-[38vh] min-h-[260px] w-full animate-pulse bg-neutral-200 dark:bg-neutral-800" />
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <aside className="w-full flex-none space-y-6 md:w-56">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-3 w-16 animate-pulse rounded-sm bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-8 w-full animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
              </div>
            ))}
          </aside>
          <div className="flex-1">
            <div className="mb-6 h-4 w-24 animate-pulse rounded-sm bg-neutral-200 dark:bg-neutral-800" />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                  <div className="mt-3 h-3 w-3/4 animate-pulse rounded-sm bg-neutral-200 dark:bg-neutral-800" />
                  <div className="mt-2 h-3 w-1/4 animate-pulse rounded-sm bg-neutral-200 dark:bg-neutral-800" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
