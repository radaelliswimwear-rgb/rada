"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "components/auth/auth-store";
import { usersStorage } from "lib/auth/users-storage";
import type { PublicUser } from "lib/auth/types";
import { formatDate } from "lib/format";
import { Pagination } from "./pagination";
import { SearchInput } from "./search-input";

const PAGE_SIZE = 10;

export function UsersTable({ initialUsers }: { initialUsers: PublicUser[] }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(initialUsers);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((user) =>
      [user.name, user.email].join(" ").toLowerCase().includes(normalized),
    );
  }, [users, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const onSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const onToggleRole = async (target: PublicUser) => {
    const nextRole = target.role === "ADMIN" ? "USER" : "ADMIN";
    setPendingId(target.id);
    await usersStorage.updateRole(target.id, nextRole);
    setPendingId(null);
    setUsers((prev) =>
      prev.map((u) => (u.id === target.id ? { ...u, role: nextRole } : u)),
    );
    toast(
      nextRole === "ADMIN"
        ? `${target.name} ahora es administrador.`
        : `${target.name} ya no es administrador.`,
    );
  };

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 py-14 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500">Todavía no hay usuarios.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <SearchInput
          value={query}
          onChange={onSearch}
          placeholder="Buscar por nombre o email..."
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 py-14 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">
            Ningún usuario coincide con la búsqueda.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Alta</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
                >
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        user.role === "ADMIN"
                          ? "rounded-full bg-black px-2.5 py-1 text-xs uppercase tracking-wide text-white dark:bg-white dark:text-black"
                          : "rounded-full bg-neutral-100 px-2.5 py-1 text-xs uppercase tracking-wide text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
                      }
                    >
                      {user.role === "ADMIN" ? "Admin" : "Cliente"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={
                        pendingId === user.id || user.id === currentUser?.id
                      }
                      onClick={() => onToggleRole(user)}
                      title={
                        user.id === currentUser?.id
                          ? "No podés cambiar tu propio rol."
                          : undefined
                      }
                      className="text-xs text-neutral-500 underline-offset-4 hover:text-black hover:underline disabled:opacity-40 dark:hover:text-white"
                    >
                      {user.role === "ADMIN" ? "Quitar admin" : "Hacer admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
