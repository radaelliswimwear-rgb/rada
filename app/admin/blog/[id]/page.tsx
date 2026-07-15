import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "components/admin/admin-shell";
import { BlogForm } from "components/admin/blog-form";
import Footer from "components/layout/footer";
import { adminBlogRepository } from "lib/admin/blog-repository";
import type { AdminBlogPostInput } from "lib/admin/blog-actions";

export const metadata: Metadata = {
  title: "Admin — Editar post",
  robots: { index: false, follow: false },
};

export default async function EditAdminBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await adminBlogRepository.getById(id);
  if (!post) notFound();

  const initialValues: AdminBlogPostInput = {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    tags: post.tags,
    published: post.published,
    authorName: post.authorName,
  };

  return (
    <>
      <AdminShell title="Editar post">
        <BlogForm postId={post.id} initialValues={initialValues} />
      </AdminShell>
      <Footer />
    </>
  );
}
