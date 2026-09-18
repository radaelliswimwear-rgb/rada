import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "components/layout/footer";
import { blogRepository } from "lib/blog/blog-repository";
import { markdownToHtml } from "lib/blog/markdown";
import { formatDate } from "lib/format";
import { JsonLd } from "lib/seo/json-ld";
import { SITE_NAME, SITE_URL } from "lib/seo/site";

export async function generateStaticParams() {
  const slugs = await blogRepository.listSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await blogRepository.getBySlug(slug);
  if (!post) return {};

  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage }],
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const post = await blogRepository.getBySlug(slug);
  if (!post) return notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: [post.coverImage],
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: post.authorName },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <article className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <nav aria-label="Miga de pan" className="mb-6 text-xs text-neutral-500">
          <Link href="/" className="hover:text-black dark:hover:text-white">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-black dark:hover:text-white">
            Blog
          </Link>
        </nav>

        <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">
          {formatDate(post.publishedAt)} · {post.authorName}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {post.title}
        </h1>

        <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-cover"
            priority
          />
        </div>

        <div
          className="prose prose-neutral mt-10 max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
        />

        {post.tags.length > 0 ? (
          <ul className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
      <Footer />
    </>
  );
}
