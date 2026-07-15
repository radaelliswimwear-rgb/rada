import type { Metadata } from "next";
import { AdminShell } from "components/admin/admin-shell";
import { BlogForm } from "components/admin/blog-form";
import Footer from "components/layout/footer";

export const metadata: Metadata = {
  title: "Admin — Nuevo post",
  robots: { index: false, follow: false },
};

export default function NewAdminBlogPostPage() {
  return (
    <>
      <AdminShell title="Nuevo post">
        <BlogForm />
      </AdminShell>
      <Footer />
    </>
  );
}
