import { expect, test } from "@playwright/test";

test.describe("SSO / SAML (Better Auth)", () => {
  test("sign-in page shows email field", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("textbox", { name: /^email$/i })).toBeVisible();
  });

  test("guest is redirected from org SSO settings to sign-in", async ({ page }) => {
    await page.goto("/organizations/any-org/settings/sso");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
