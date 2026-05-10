import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllBlogPosts } from "@/lib/mdx/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on shipping multi-tenant SaaS with Blank SaaS.",
  openGraph: {
    title: "Blog — Blank SaaS",
    description: "Notes on shipping multi-tenant SaaS with Blank SaaS.",
  },
};

export default async function BlogIndexPage() {
  const posts = await getAllBlogPosts();

  return (
    <main className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-semibold tracking-tight">Blog</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Long-form updates and implementation notes from the starter.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
              <Card className="h-full transition-colors group-hover:border-primary/50">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <time dateTime={post.date}>{post.formattedDate}</time>
                    <span>·</span>
                    <span>{post.readingMinutes} min read</span>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary">
                    {post.title}
                  </CardTitle>
                  <CardDescription>{post.description}</CardDescription>
                  {post.tags?.length ? (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {post.tags.map((t) => (
                        <Badge key={t} variant="secondary">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-medium text-primary underline-offset-4 group-hover:underline">
                    Read post
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
