import fs from "fs/promises";
import path from "path";

import matter from "gray-matter";

import { blogFrontmatterSchema, type BlogFrontmatter } from "@/lib/mdx/schemas";
import { formatContentDate, readingMinutesFromMdx } from "@/lib/mdx/format";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type BlogListItem = BlogFrontmatter & {
  slug: string;
  readingMinutes: number;
  formattedDate: string;
};

async function listMdxFiles() {
  try {
    const names = await fs.readdir(BLOG_DIR);
    return names.filter((f) => f.endsWith(".mdx"));
  } catch {
    return [];
  }
}

export async function getAllBlogPosts(): Promise<BlogListItem[]> {
  const files = await listMdxFiles();
  const posts: BlogListItem[] = [];

  for (const file of files) {
    const slug = file.replace(/\.mdx$/i, "");
    const raw = await fs.readFile(path.join(BLOG_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const parsed = blogFrontmatterSchema.safeParse(data);
    if (!parsed.success) continue;

    posts.push({
      ...parsed.data,
      slug,
      readingMinutes: readingMinutesFromMdx(content),
      formattedDate: formatContentDate(parsed.data.date),
    });
  }

  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts;
}

export async function getBlogPostRawBySlug(slug: string) {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const { data } = matter(raw);
    const parsed = blogFrontmatterSchema.safeParse(data);
    if (!parsed.success) return null;
    return { raw, meta: parsed.data };
  } catch {
    return null;
  }
}
