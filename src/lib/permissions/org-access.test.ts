import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./feature", () => ({
  isGranularPermissionsEnabled: vi.fn(),
}));

vi.mock("./check", () => ({
  resolveResourceAccess: vi.fn(),
  checkPermission: vi.fn(),
}));

describe("orgScopedAllows", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const feature = await import("./feature");
    const check = await import("./check");
    vi.mocked(feature.isGranularPermissionsEnabled).mockReturnValue(false);
    vi.mocked(check.resolveResourceAccess).mockImplementation(async (p) => {
      if (p.rbacAllows) return { allowed: true };
      return p.granular();
    });
  });

  it("matches RBAC only when granular feature is disabled", async () => {
    const { orgScopedAllows } = await import("./org-access");
    await expect(
      orgScopedAllows({
        organizationId: "o1",
        userId: "u1",
        userRole: "member",
        rbacAllows: true,
        resourceType: "org_team",
        action: "invite",
      }),
    ).resolves.toBe(true);

    await expect(
      orgScopedAllows({
        organizationId: "o1",
        userId: "u1",
        userRole: "member",
        rbacAllows: false,
        resourceType: "org_team",
        action: "invite",
      }),
    ).resolves.toBe(false);
  });

  it("delegates to resolveResourceAccess when granular feature is enabled", async () => {
    const feature = await import("./feature");
    const check = await import("./check");
    vi.mocked(feature.isGranularPermissionsEnabled).mockReturnValue(true);
    vi.mocked(check.resolveResourceAccess).mockResolvedValue({ allowed: true });

    const { orgScopedAllows } = await import("./org-access");
    await expect(
      orgScopedAllows({
        organizationId: "o1",
        userId: "u1",
        userRole: "member",
        rbacAllows: false,
        resourceType: "org_team",
        action: "invite",
      }),
    ).resolves.toBe(true);
    expect(check.resolveResourceAccess).toHaveBeenCalled();
  });
});
