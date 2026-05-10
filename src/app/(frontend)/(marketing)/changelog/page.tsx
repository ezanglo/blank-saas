import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";

import { Badge } from "@/components/ui/badge";
import { getAllChangelogEntries } from "@/lib/mdx/changelog";
import { MDX_COMPONENTS } from "@/lib/mdx/mdx-components";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Release notes and shipped changes for Blank SaaS.",
  openGraph: {
    title: "Changelog — Blank SaaS",
    description: "Release notes and shipped changes for Blank SaaS.",
  },
};

export default async function ChangelogPage() {
  const entries = await getAllChangelogEntries();
  const withContent = await Promise.all(
    entries.map(async (entry) => {
      const { content } = await compileMDX({
        source: entry.body,
        options: { parseFrontmatter: false },
        components: MDX_COMPONENTS,
      });
      return { ...entry, content };
    }),
  );

  return (
    <main className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight">Changelog</h1>
        <p className="mt-3 text-muted-foreground">
          New releases and notable updates to the starter.
        </p>
        <ol className="relative ml-1 mt-12 border-l border-border">
          {withContent.map((entry) => (
            <li key={entry.slug} className="relative mb-14 pl-8 last:mb-0">
              <div
                className="absolute -left-[5px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary"
                aria-hidden
              />
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">v{entry.version}</Badge>
                <time
                  className="text-sm text-muted-foreground"
                  dateTime={entry.date}
                >
                  {entry.formattedDate}
                </time>
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                {entry.title}
              </h2>
              <div className="mt-4">{entry.content}</div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
