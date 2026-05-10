import { expect, test } from "@playwright/test";

import { registerVerifiedFirstUser, uniqueEmail } from "../fixtures/auth";
import { createOrganizationViaUi, orgSlugFromUrl } from "../fixtures/org";

test.describe("members & invitations", () => {
  test("invite member flow sends invitation", async ({ page }) => {
    const ownerEmail = uniqueEmail("mgr");
    await registerVerifiedFirstUser(page, { name: "E2E Manager", email: ownerEmail });
    await createOrganizationViaUi(page, `Team Org ${Date.now()}`);
    const slug = orgSlugFromUrl(page.url());
    expect(slug).toBeTruthy();

    await page.goto(`/organizations/${slug}/settings/team`);
    await expect(page.getByRole("heading", { name: /^members$/i })).toBeVisible();

    await page.getByRole("button", { name: /^invite$/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const invitee = uniqueEmail("invitee");
    await page.getByRole("dialog").getByPlaceholder("teammate@example.com").fill(invitee);
    await page.getByRole("button", { name: /^send invitation$/i }).click();
    await expect(page.getByText(/invitation sent/i)).toBeVisible();

    await page.getByRole("tab", { name: /^invites$/i }).click();
    await expect(page.getByText(invitee)).toBeVisible();
  });
});
