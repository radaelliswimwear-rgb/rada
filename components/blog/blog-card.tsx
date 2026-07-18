import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "lib/blog/types";
import { formatDate } from "lib/format";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="group">
      <Link
        href={`/blog/${post.slug}`}
        className="relative block aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900"
      >
        <Image
          src={post.coverImage}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </Link>
      <div className="mt-3">
        <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">
          {formatDate(post.publishedAt)}
        </p>
        <h3 className="mt-1 text-lg font-medium">
          <Link href={`/blog/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
          {post.excerpt}
        </p>
      </div>
    </article>
  );
}
