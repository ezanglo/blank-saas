import { expect, test } from "@playwright/test";

import {
  registerVerifiedFirstUser,
  signOut,
  signUp,
  uniqueEmail,
} from "../fixtures/auth";

test.describe("auth", () => {
  test("login page shows email field", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("textbox", { name: /^email$/i })).toBeVisible();
  });

  test("first sign-up then sign-in reaches app shell", async ({ page }) => {
    const email = uniqueEmail("first");
    await registerVerifiedFirstUser(page, { name: "E2E Owner", email });
    await expect(page.locator("main")).toBeVisible();
  });

  test("duplicate registration shows error", async ({ page }) => {
    const email = uniqueEmail("dup");
    await registerVerifiedFirstUser(page, { name: "E2E Dup", email });
    await signOut(page, email);

    await signUp(page, { name: "Other", email });
    await expect(page.getByText(/email|exists|registered|already/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("logout returns to sign-in", async ({ page }) => {
    const email = uniqueEmail("logout");
    await registerVerifiedFirstUser(page, { name: "E2E Logout", email });
    await signOut(page, email);
    await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
  });

  test("wrong password shows error", async ({ page }) => {
    const email = uniqueEmail("badpw");
    await registerVerifiedFirstUser(page, { name: "E2E BadPw", email });
    await signOut(page, email);
    await page.goto("/sign-in");
    await page.getByRole("textbox", { name: /^email$/i }).fill(email);
    await page.locator('input[type="password"]').fill("wrong-password-xxxxx");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page.getByText(/invalid|incorrect|wrong|credentials|sign-in failed/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("forgot password submits when SMTP configured", async ({ page }) => {
    test.skip(!process.env.SMTP_HOST, "Mailhog/SMTP not configured (set SMTP_HOST for CI/local)");

    const email = uniqueEmail("reset");
    await registerVerifiedFirstUser(page, { name: "E2E Reset", email });
    await signOut(page, email);

    await page.goto("/forgot-password");
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByRole("button", { name: /send reset link/i }).click();
    await expect(page.getByText(/if that email exists/i)).toBeVisible({ timeout: 15_000 });
  });
});
