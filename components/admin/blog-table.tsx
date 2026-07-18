"use client";

import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { adminBlogRepository } from "lib/admin/blog-repository";
import type { AdminBlogPost } from "lib/admin/blog-actions";
import { formatDate } from "lib/format";
import { Pagination } from "./pagination";
import { SearchInput } from "./search-input";

const PAGE_SIZE = 10;

export function BlogTable({ initialPosts }: { initialPosts: AdminBlogPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return posts;
    return posts.filter((post) =>
      [post.title, post.slug].join(" ").toLowerCase().includes(normalized),
    );
  }, [posts, query]);

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

  const onDelete = async (post: AdminBlogPost) => {
    if (confirmingId !== post.id) {
      setConfirmingId(post.id);
      return;
    }
    setConfirmingId(null);
    setPendingId(post.id);
    const result = await adminBlogRepository.remove(post.id);
    setPendingId(null);
    if (!result.success) {
      toast(result.error);
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    toast("Post eliminado.");
  };

  return (
    <div>
      <div className="mb-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={query}
          onChange={onSearch}
          placeholder="Buscar por título o slug..."
        />
        <Link
          href="/admin/blog/nuevo"
          className="flex items-center justify-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 dark:bg-white dark:text-black"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo post
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 py-14 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">
            {posts.length === 0
              ? "No hay posts todavía."
              : "Ningún post coincide con la búsqueda."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Publicado</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{post.title}</p>
                    <p className="text-xs text-neutral-500">{post.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {formatDate(post.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    {post.published ? "Publicado" : "Borrador"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        aria-label="Editar post"
                        className="text-neutral-500 hover:text-black dark:hover:text-white"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      {confirmingId === post.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onDelete(post)}
                            disabled={pendingId === post.id}
                            className="text-xs font-medium text-red-600 underline-offset-4 hover:underline disabled:opacity-50"
                          >
                            ¿Eliminar?
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            className="text-xs text-neutral-500 hover:text-black dark:hover:text-white"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onDelete(post)}
                          aria-label="Eliminar post"
                          className="text-neutral-500 hover:text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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
