"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { adminBlogRepository } from "lib/admin/blog-repository";
import type { AdminBlogPostInput } from "lib/admin/blog-actions";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";
const labelClass =
  "mb-1.5 block text-xs uppercase tracking-[0.15em] text-neutral-500";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const EMPTY_FORM: AdminBlogPostInput = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  tags: [],
  published: true,
  authorName: "Equipo Radaelli",
};

export function BlogForm({
  postId,
  initialValues,
}: {
  postId?: string;
  initialValues?: AdminBlogPostInput;
}) {
  const router = useRouter();
  const [form, setForm] = useState<AdminBlogPostInput>(
    initialValues ?? EMPTY_FORM,
  );
  const [tagsText, setTagsText] = useState(
    (initialValues?.tags ?? []).join(", "),
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const input: AdminBlogPostInput = { ...form, tags };

    setIsSubmitting(true);
    const result = postId
      ? await adminBlogRepository.update(postId, input)
      : await adminBlogRepository.create(input);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push("/admin/blog");
    router.refresh();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="grid max-w-2xl gap-4 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800"
    >
      <div>
        <label htmlFor="title" className={labelClass}>
          Título
        </label>
        <input
          id="title"
          required
          value={form.title}
          onChange={(e) => {
            const title = e.target.value;
            setForm((prev) => ({
              ...prev,
              title,
              slug: slugTouched ? prev.slug : slugify(title),
            }));
          }}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="slug" className={labelClass}>
          Slug (URL)
        </label>
        <input
          id="slug"
          required
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setForm({ ...form, slug: e.target.value });
          }}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="excerpt" className={labelClass}>
          Resumen
        </label>
        <textarea
          id="excerpt"
          required
          rows={2}
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="content" className={labelClass}>
          Contenido (Markdown básico: #, ##, **negrita**, *cursiva*, listas con
          -)
        </label>
        <textarea
          id="content"
          required
          rows={10}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="coverImage" className={labelClass}>
          Imagen de portada (URL)
        </label>
        <input
          id="coverImage"
          required
          placeholder="https://..."
          value={form.coverImage}
          onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="authorName" className={labelClass}>
            Autor
          </label>
          <input
            id="authorName"
            required
            value={form.authorName}
            onChange={(e) => setForm({ ...form, authorName: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="tags" className={labelClass}>
            Etiquetas (separadas por coma)
          </label>
          <input
            id="tags"
            placeholder="tendencias, temporada"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="published"
          type="checkbox"
          checked={form.published}
          onChange={(e) => setForm({ ...form, published: e.target.checked })}
          className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-600"
        />
        <label
          htmlFor="published"
          className="text-sm text-neutral-600 dark:text-neutral-400"
        >
          Publicado (visible en /blog)
        </label>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-black px-6 py-2.5 text-sm font-medium tracking-wide text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {isSubmitting
            ? "Guardando..."
            : postId
              ? "Guardar cambios"
              : "Crear post"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/blog")}
          className="rounded-full border border-neutral-300 px-6 py-2.5 text-sm text-black dark:border-neutral-700 dark:text-white"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
