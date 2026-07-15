"use server";

import { prisma } from "lib/prisma";
import type { BlogPost as BlogPostRow } from "@prisma/client";
import type { AdminActionResult } from "./types";

// CRUD de blog para el Panel Administrativo (Sprint 17) — mismo criterio de
// error explícito que lib/admin/products-actions.ts: quien administra
// necesita saber si la escritura falló, a diferencia de lib/blog/blog-actions.ts
// (lectura pública, degrada a []/null).
export type AdminBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  published: boolean;
  authorName: string;
  publishedAt: string;
};

export type AdminBlogPostInput = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  published: boolean;
  authorName: string;
};

function toAdminBlogPost(row: BlogPostRow): AdminBlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.coverImage,
    tags: row.tags,
    published: row.published,
    authorName: row.authorName,
    publishedAt: row.publishedAt.toISOString(),
  };
}

export async function listAllBlogPostsAction(): Promise<AdminBlogPost[]> {
  try {
    const rows = await prisma.blogPost.findMany({
      orderBy: { publishedAt: "desc" },
    });
    return rows.map(toAdminBlogPost);
  } catch (error) {
    console.error("listAllBlogPostsAction: no se pudo leer el blog", error);
    return [];
  }
}

export async function getAdminBlogPostByIdAction(
  id: string,
): Promise<AdminBlogPost | null> {
  try {
    const row = await prisma.blogPost.findUnique({ where: { id } });
    return row ? toAdminBlogPost(row) : null;
  } catch (error) {
    console.error("getAdminBlogPostByIdAction: no se pudo leer el post", error);
    return null;
  }
}

export async function createBlogPostAction(
  input: AdminBlogPostInput,
): Promise<AdminActionResult> {
  const existing = await prisma.blogPost.findUnique({
    where: { slug: input.slug },
  });
  if (existing) {
    return { success: false, error: "Ya existe un post con ese slug." };
  }

  try {
    await prisma.blogPost.create({ data: input });
    return { success: true };
  } catch (error) {
    console.error("createBlogPostAction: no se pudo crear el post", error);
    return { success: false, error: "No se pudo crear el post." };
  }
}

export async function updateBlogPostAction(
  id: string,
  input: AdminBlogPostInput,
): Promise<AdminActionResult> {
  const conflict = await prisma.blogPost.findFirst({
    where: { slug: input.slug, NOT: { id } },
  });
  if (conflict) {
    return { success: false, error: "Ya existe otro post con ese slug." };
  }

  try {
    await prisma.blogPost.update({ where: { id }, data: input });
    return { success: true };
  } catch (error) {
    console.error("updateBlogPostAction: no se pudo actualizar el post", error);
    return { success: false, error: "No se pudo actualizar el post." };
  }
}

export async function deleteBlogPostAction(
  id: string,
): Promise<AdminActionResult> {
  try {
    await prisma.blogPost.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("deleteBlogPostAction: no se pudo eliminar el post", error);
    return { success: false, error: "No se pudo eliminar el post." };
  }
}
