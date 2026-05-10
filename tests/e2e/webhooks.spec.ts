import { expect, test } from "@playwright/test";

import { registerVerifiedFirstUser, uniqueEmail } from "../fixtures/auth";
import { createOrganizationViaUi, orgSlugFromUrl } from "../fixtures/org";

test.describe("webhooks", () => {
  test("webhooks settings page loads", async ({ page }) => {
    const email = uniqueEmail("wh");
    await registerVerifiedFirstUser(page, { name: "E2E Webhooks", email });
    await createOrganizationViaUi(page, `Webhook Org ${Date.now()}`);
    const slug = orgSlugFromUrl(page.url());
    await page.goto(`/organizations/${slug}/settings/webhooks`);
    await expect(page.getByRole("heading", { name: /^webhooks$/i })).toBeVisible();
    await expect(page.getByText(/svix/i)).toBeVisible();
  });
});
