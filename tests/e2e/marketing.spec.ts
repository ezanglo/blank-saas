import { expect, test } from "@playwright/test";

test.describe("marketing", () => {
  test("homepage hero and primary CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /multi-tenant foundations/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /^get started$/i }).first()).toHaveAttribute(
      "href",
      "/sign-up",
    );
  });

  test("pricing shows three tier cards", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { level: 1, name: /^pricing$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^free$/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /^pro$/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /^enterprise$/i }).first()).toBeVisible();
  });

  test("blog index lists posts", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1, name: /^blog$/i })).toBeVisible();
    await expect(page.locator('a[href^="/blog/"]').first()).toBeVisible();
  });

  test("blog post renders MDX content", async ({ page }) => {
    await page.goto("/blog/getting-started");
    await expect(page.getByRole("article")).toBeVisible();
  });

  test("changelog renders timeline heading", async ({ page }) => {
    await page.goto("/changelog");
    await expect(page.getByRole("heading", { level: 1, name: /^changelog$/i })).toBeVisible();
  });

  test("legal pages load", async ({ page }) => {
    await page.goto("/legal/terms");
    await expect(page.locator("main")).toBeVisible();
    await page.goto("/legal/privacy");
    await expect(page.locator("main")).toBeVisible();
  });

  test("nav Get started goes to sign-up", async ({ page }) => {
    await page.goto("/features");
    await page
      .getByRole("banner")
      .getByRole("link", { name: /^get started$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/sign-up/);
  });
});
