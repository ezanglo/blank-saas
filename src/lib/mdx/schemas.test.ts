import { describe, expect, it } from "vitest";

import { blogFrontmatterSchema, changelogFrontmatterSchema } from "@/lib/mdx/schemas";

describe("blogFrontmatterSchema", () => {
  it("accepts PRD-shaped blog frontmatter", () => {
    const r = blogFrontmatterSchema.safeParse({
      title: "Hello",
      date: "2026-01-15",
      description: "Summary",
      author: { name: "Jane Doe", avatar: "/a.jpg" },
      tags: ["nextjs"],
    });
    expect(r.success).toBe(true);
  });

  it("rejects bad date format", () => {
    const r = blogFrontmatterSchema.safeParse({
      title: "Hello",
      date: "01/15/2026",
      description: "Summary",
      author: { name: "Jane" },
    });
    expect(r.success).toBe(false);
  });

  it("rejects missing author name", () => {
    const r = blogFrontmatterSchema.safeParse({
      title: "Hello",
      date: "2026-01-15",
      description: "Summary",
      author: {},
    });
    expect(r.success).toBe(false);
  });
});

describe("changelogFrontmatterSchema", () => {
  it("accepts semver-style version and ISO date", () => {
    const r = changelogFrontmatterSchema.safeParse({
      version: "1.0.0",
      date: "2026-01-01",
      title: "Launch",
    });
    expect(r.success).toBe(true);
  });

  it("rejects version without semver prefix", () => {
    const r = changelogFrontmatterSchema.safeParse({
      version: "launch",
      date: "2026-01-01",
      title: "X",
    });
    expect(r.success).toBe(false);
  });
});
