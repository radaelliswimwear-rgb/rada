"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto my-4 flex max-w-xl flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 dark:border-neutral-800 dark:bg-black">
      <h2 className="text-xl font-bold">Ha ocurrido un error</h2>
      <p className="my-2">
        Hubo un problema con la tienda. Puede ser algo temporal, intenta de
        nuevo en unos segundos.
      </p>
      <button
        className="mx-auto mt-4 flex w-full items-center justify-center rounded-full bg-black p-4 tracking-wide text-white hover:opacity-90 dark:bg-white dark:text-black"
        onClick={() => reset()}
      >
        Reintentar
      </button>
    </div>
  );
}
