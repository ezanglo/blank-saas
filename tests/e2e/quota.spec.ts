import { expect, test } from "@playwright/test";

import { registerVerifiedFirstUser, uniqueEmail } from "../fixtures/auth";
import { createOrganizationViaUi, orgSlugFromUrl } from "../fixtures/org";

test.describe("quota / usage", () => {
  test("usage dashboard shows plan and resource meters", async ({ page }) => {
    const email = uniqueEmail("usage");
    await registerVerifiedFirstUser(page, { name: "E2E Usage", email });
    await createOrganizationViaUi(page, `Usage Org ${Date.now()}`);
    const slug = orgSlugFromUrl(page.url());
    await page.goto(`/organizations/${slug}/settings/usage`);
    await expect(page.getByRole("heading", { name: /^usage$/i })).toBeVisible();
    await expect(page.getByText(/^plan:/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /^refresh$/i })).toBeVisible();
  });
});
