import { describe, expect, it } from "vitest";

import { formatContentDate, readingMinutesFromMdx } from "@/lib/mdx/format";

describe("formatContentDate", () => {
  it("formats YYYY-MM-DD as long US date", () => {
    expect(formatContentDate("2026-01-15")).toMatch(/January/);
    expect(formatContentDate("2026-01-15")).toMatch(/15/);
  });
});

describe("readingMinutesFromMdx", () => {
  it("returns at least 1 minute", () => {
    expect(readingMinutesFromMdx("word")).toBe(1);
  });

  it("scales with word count", () => {
    const words = Array.from({ length: 400 }, () => "word").join(" ");
    expect(readingMinutesFromMdx(words)).toBeGreaterThanOrEqual(2);
  });
});
