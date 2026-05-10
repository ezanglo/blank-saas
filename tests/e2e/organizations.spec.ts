import { expect, test } from "@playwright/test";

import { registerVerifiedFirstUser, uniqueEmail } from "../fixtures/auth";
import { createOrganizationViaUi, orgSlugFromUrl } from "../fixtures/org";

test.describe("organizations", () => {
  test("create organization reaches slug route", async ({ page }) => {
    const email = uniqueEmail("org");
    await registerVerifiedFirstUser(page, { name: "E2E Org Creator", email });
    await createOrganizationViaUi(page, `Workspace ${Date.now()}`);
    expect(orgSlugFromUrl(page.url())).toBeTruthy();
  });

  test("new workspace appears on organizations index", async ({ page }) => {
    const email = uniqueEmail("orgidx");
    await registerVerifiedFirstUser(page, { name: "E2E Org Index", email });
    const name = `Listed Org ${Date.now()}`;
    await createOrganizationViaUi(page, name);
    await page.goto("/organizations");
    await expect(page.getByText(name)).toBeVisible();
  });

  test("forbidden query shows hub alert", async ({ page }) => {
    const email = uniqueEmail("hub403");
    await registerVerifiedFirstUser(page, { name: "E2E Hub", email });
    await page.goto("/organizations?error=forbidden");
    await expect(page.locator('[role="alert"]').filter({ hasText: /access denied/i })).toBeVisible();
    await page.goto("/organizations?error=feature_disabled");
    await expect(
      page.locator('[role="alert"]').filter({ hasText: /feature unavailable/i }),
    ).toBeVisible();
  });
});
