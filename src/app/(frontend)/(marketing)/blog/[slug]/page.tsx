import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { getAllBlogPosts, getBlogPostRawBySlug } from "@/lib/mdx/blog";
import { formatContentDate } from "@/lib/mdx/format";
import { MDX_COMPONENTS } from "@/lib/mdx/mdx-components";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostRawBySlug(slug);
  if (!post) return { title: "Post" };
  return {
    title: post.meta.title,
    description: post.meta.description,
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostRawBySlug(slug);
  if (!post) notFound();

  const { content } = await compileMDX({
    source: post.raw,
    options: { parseFrontmatter: true },
    components: MDX_COMPONENTS,
  });

  return (
    <main className="px-6 py-12 md:py-16">
      <article className="mx-auto max-w-3xl">
        <header className="border-b pb-8">
          <div className="flex flex-wrap gap-2">
            {post.meta.tags?.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            {post.meta.title}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{post.meta.description}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            <time dateTime={post.meta.date}>{formatContentDate(post.meta.date)}</time>
            {" · "}
            {post.meta.author.name}
          </p>
        </header>
        <div className="pb-12 pt-8">{content}</div>
      </article>
    </main>
  );
}
