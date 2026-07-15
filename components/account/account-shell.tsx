import type { ReactNode } from "react";
import Link from "next/link";
import { RequireAuth } from "components/auth/require-auth";
import { AccountNav } from "./account-nav";

export function AccountShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <nav aria-label="Miga de pan" className="mb-6 text-xs text-neutral-500">
          <Link href="/" className="hover:text-black dark:hover:text-white">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <Link
            href="/cuenta"
            className="hover:text-black dark:hover:text-white"
          >
            Mi cuenta
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-800 dark:text-neutral-300">
            {title}
          </span>
        </nav>

        <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>

        <div className="flex flex-col gap-8 md:flex-row">
          <aside className="w-full flex-none md:w-56">
            <AccountNav />
          </aside>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </RequireAuth>
  );
}
