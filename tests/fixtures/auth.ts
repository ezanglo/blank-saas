import { expect, type Page } from "@playwright/test";

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}@example.com`;
}

const DEFAULT_PASSWORD = "TestPass123!";

export async function signUp(page: Page, opts: { name: string; email: string; password?: string }) {
  const password = opts.password ?? DEFAULT_PASSWORD;
  await page.goto("/sign-up");
  await page.getByLabel(/^name$/i).fill(opts.name);
  await page.getByLabel(/^email$/i).fill(opts.email);
  const pwdInputs = page.locator('input[type="password"]');
  await pwdInputs.nth(0).fill(password);
  await pwdInputs.nth(1).fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByText(/check your email/i)).toBeVisible();
}

export async function signIn(page: Page, opts: { email: string; password?: string }) {
  const password = opts.password ?? DEFAULT_PASSWORD;
  await page.goto("/sign-in");
  await page.getByRole("textbox", { name: /^email$/i }).fill(opts.email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/(dashboard|organizations)/);
}

/** First user in DB is auto-verified — suitable for empty CI database. */
export async function registerVerifiedFirstUser(
  page: Page,
  opts: { name: string; email: string; password?: string },
) {
  await signUp(page, opts);
  await signIn(page, { email: opts.email, password: opts.password });
}

export async function signOut(page: Page, displayNameOrEmail: string) {
  await page.getByRole("button", { name: new RegExp(displayNameOrEmail, "i") }).click();
  await page.getByRole("menuitem", { name: /^sign out$/i }).click();
  await page.waitForURL(/\/sign-in/);
}
