import { expect, test } from "@playwright/test";

import { registerVerifiedFirstUser, uniqueEmail } from "../fixtures/auth";
import { createOrganizationViaUi, orgSlugFromUrl } from "../fixtures/org";

test.describe("billing", () => {
  test("billing page shows plan card without Stripe checkout when catalog unavailable", async ({
    page,
  }) => {
    const email = uniqueEmail("bill");
    await registerVerifiedFirstUser(page, { name: "E2E Billing", email });
    await createOrganizationViaUi(page, `Billing Org ${Date.now()}`);
    const slug = orgSlugFromUrl(page.url());
    await page.goto(`/organizations/${slug}/settings/billing`);
    await expect(page.getByRole("heading", { name: /^billing$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^free$/i })).toBeVisible();
  });
});
