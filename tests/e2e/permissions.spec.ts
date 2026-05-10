import { expect, test } from "@playwright/test";

import { registerVerifiedFirstUser, uniqueEmail } from "../fixtures/auth";
import { createOrganizationViaUi, orgSlugFromUrl } from "../fixtures/org";

test.describe("granular permissions", () => {
  test.beforeEach(() => {
    test.skip(
      process.env.NEXT_PUBLIC_FEATURE_GRANULAR_PERMISSIONS !== "true",
      "Granular permissions feature flag off",
    );
  });

  test("owner opens permissions settings", async ({ page }) => {
    const email = uniqueEmail("perm");
    await registerVerifiedFirstUser(page, { name: "E2E Permissions", email });
    await createOrganizationViaUi(page, `Perm Org ${Date.now()}`);
    const slug = orgSlugFromUrl(page.url());
    await page.goto(`/organizations/${slug}/settings/permissions`);
    await expect(page.getByRole("heading", { name: /^permissions$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^grant permission$/i })).toBeVisible();
  });
});
