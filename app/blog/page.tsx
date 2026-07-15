import type { Metadata } from "next";
import { BlogCard } from "components/blog/blog-card";
import Footer from "components/layout/footer";
import { blogRepository } from "lib/blog/blog-repository";

export const metadata: Metadata = {
  title: "Blog",
  description: "Historias, guías de estilo y novedades de LAGO.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog",
    description: "Historias, guías de estilo y novedades de LAGO.",
  },
};

export default async function BlogIndexPage() {
  const posts = await blogRepository.listAll();

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Blog
        </h1>
        <p className="mb-10 max-w-2xl text-neutral-600 dark:text-neutral-400">
          Historias, guías de estilo y novedades de LAGO.
        </p>

        {posts.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Todavía no hay artículos publicados.
          </p>
        ) : (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
