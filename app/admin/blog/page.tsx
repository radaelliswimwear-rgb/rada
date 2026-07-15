import type { Metadata } from "next";
import { AdminShell } from "components/admin/admin-shell";
import { BlogTable } from "components/admin/blog-table";
import Footer from "components/layout/footer";
import { adminBlogRepository } from "lib/admin/blog-repository";

export const metadata: Metadata = {
  title: "Admin — Blog",
  robots: { index: false, follow: false },
};

export default async function AdminBlogPage() {
  const posts = await adminBlogRepository.listAll();

  return (
    <>
      <AdminShell title="Blog">
        <BlogTable initialPosts={posts} />
      </AdminShell>
      <Footer />
    </>
  );
}
