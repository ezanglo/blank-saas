import fs from "fs/promises";
import path from "path";

import matter from "gray-matter";

import {
  changelogFrontmatterSchema,
  type ChangelogFrontmatter,
} from "@/lib/mdx/schemas";
import { formatContentDate } from "@/lib/mdx/format";

const CHANGELOG_DIR = path.join(process.cwd(), "content/changelog");

export type ChangelogEntry = ChangelogFrontmatter & {
  slug: string;
  body: string;
  formattedDate: string;
};

async function listMdxFiles() {
  try {
    const names = await fs.readdir(CHANGELOG_DIR);
    return names.filter((f) => f.endsWith(".mdx"));
  } catch {
    return [];
  }
}

export async function getAllChangelogEntries(): Promise<ChangelogEntry[]> {
  const files = await listMdxFiles();
  const entries: ChangelogEntry[] = [];

  for (const file of files) {
    const slug = file.replace(/\.mdx$/i, "");
    const raw = await fs.readFile(path.join(CHANGELOG_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const parsed = changelogFrontmatterSchema.safeParse(data);
    if (!parsed.success) continue;

    entries.push({
      ...parsed.data,
      slug,
      body: content.trim(),
      formattedDate: formatContentDate(parsed.data.date),
    });
  }

  entries.sort((a, b) => b.date.localeCompare(a.date));
  return entries;
}
