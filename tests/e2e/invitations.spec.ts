import { expect, test } from "@playwright/test";

test.describe("invitations (guest)", () => {
  test("unauthenticated invite deep-link redirects to sign-in", async ({ page }) => {
    await page.goto("/invite/does-not-exist-invitation-id");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
