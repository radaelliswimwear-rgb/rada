import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-16">
      <Link
        href="/"
        aria-label="LAGO — inicio"
        className="relative mb-6 h-14 w-14 overflow-hidden rounded-lg ring-1 ring-black/10 dark:ring-white/15"
      >
        <Image
          src="/logo/logo-principal.png"
          alt="LAGO — Laura Gómez"
          fill
          sizes="56px"
          className="object-cover"
        />
      </Link>
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
        Mi cuenta
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-center text-sm text-neutral-500">
        {description}
      </p>

      <div className="mt-8 w-full rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800 sm:p-8">
        {children}
      </div>
    </div>
  );
}
