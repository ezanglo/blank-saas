import { expect, test } from "@playwright/test";

import { registerVerifiedFirstUser, uniqueEmail } from "../fixtures/auth";
import { createOrganizationViaUi, orgSlugFromUrl } from "../fixtures/org";

test.describe("audit logs", () => {
  test("owner sees audit logs settings page", async ({ page }) => {
    const email = uniqueEmail("audit");
    await registerVerifiedFirstUser(page, { name: "E2E Audit", email });
    await createOrganizationViaUi(page, `Audit Org ${Date.now()}`);
    const slug = orgSlugFromUrl(page.url());
    await page.goto(`/organizations/${slug}/settings/audit-logs`);
    await expect(page.getByRole("heading", { name: /^audit logs$/i })).toBeVisible();
  });
});
