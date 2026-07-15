"use client";

import {
  ArchiveBoxIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  TagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "components/auth/auth-store";

const LINKS = [
  { label: "Resumen", href: "/admin", icon: Squares2X2Icon },
  { label: "Productos", href: "/admin/productos", icon: ShoppingBagIcon },
  { label: "Categorías", href: "/admin/categorias", icon: TagIcon },
  { label: "Inventario", href: "/admin/inventario", icon: ArchiveBoxIcon },
  { label: "Pedidos", href: "/admin/pedidos", icon: ClipboardDocumentListIcon },
  { label: "Usuarios", href: "/admin/usuarios", icon: UsersIcon },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors duration-200",
              active
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900",
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={async () => {
          await logout();
          router.push("/");
        }}
        className="mt-2 flex items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
      >
        <ArrowRightOnRectangleIcon className="h-4 w-4" />
        Cerrar sesión
      </button>
    </nav>
  );
}
