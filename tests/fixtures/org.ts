import { expect, type Page } from "@playwright/test";

/** Creates an organization via dashboard UI; lands on `/organizations/:slug`. */
export async function createOrganizationViaUi(page: Page, name: string) {
  await page.goto("/organizations");
  await page.getByRole("button", { name: /^new organization$/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByPlaceholder("Acme Corp").fill(name);
  await page.getByRole("dialog").getByRole("button", { name: /^create$/i }).click();
  await page.waitForURL(/\/organizations\/[^/]+\/?$/);
  await expect(page.locator("main")).toBeVisible();
}

export function orgSlugFromUrl(url: string) {
  const m = url.match(/\/organizations\/([^/?#]+)/);
  return m?.[1] ?? null;
}
