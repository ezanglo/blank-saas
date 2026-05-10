import { z } from "zod";

export const blogFrontmatterSchema = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  description: z.string().min(1),
  author: z.object({
    name: z.string().min(1),
    avatar: z.string().optional(),
  }),
  tags: z.array(z.string()).optional(),
  coverImage: z.string().optional(),
});

export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>;

export const changelogFrontmatterSchema = z.object({
  version: z
    .string()
    .min(1)
    .regex(
      /^\d+\.\d+\.\d+/,
      "Semver-style version required (e.g. 1.0.0)",
    ),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  title: z.string().min(1),
});

export type ChangelogFrontmatter = z.infer<typeof changelogFrontmatterSchema>;
