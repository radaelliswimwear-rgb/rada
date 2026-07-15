"use server";

import { prisma } from "lib/prisma";
import type { BlogPost as BlogPostRow } from "@prisma/client";
import type { BlogPost } from "./types";

// Server Actions de lectura pública del blog (Sprint 17) — mismo criterio
// de resiliencia que lib/catalog/catalog-actions.ts: degradan a [] / null
// si Postgres falla, en vez de tirar un Runtime Error en /blog.
function toBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.coverImage,
    tags: row.tags,
    authorName: row.authorName,
    publishedAt: row.publishedAt.toISOString(),
  };
}

export async function listPublishedPostsAction(): Promise<BlogPost[]> {
  try {
    const rows = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
    });
    return rows.map(toBlogPost);
  } catch (error) {
    console.error("listPublishedPostsAction: no se pudo leer el blog", error);
    return [];
  }
}

export async function listRecentPostsAction(limit = 3): Promise<BlogPost[]> {
  try {
    const rows = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
    return rows.map(toBlogPost);
  } catch (error) {
    console.error(
      "listRecentPostsAction: no se pudieron leer los posts recientes",
      error,
    );
    return [];
  }
}

export async function getPostBySlugAction(
  slug: string,
): Promise<BlogPost | null> {
  try {
    const row = await prisma.blogPost.findFirst({
      where: { slug, published: true },
    });
    return row ? toBlogPost(row) : null;
  } catch (error) {
    console.error("getPostBySlugAction: no se pudo leer el post", error);
    return null;
  }
}

export async function listPostSlugsAction(): Promise<string[]> {
  try {
    const rows = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true },
    });
    return rows.map((row) => row.slug);
  } catch (error) {
    console.error("listPostSlugsAction: no se pudieron leer los slugs", error);
    return [];
  }
}
