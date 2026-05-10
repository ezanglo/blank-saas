import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const mockGetMemberRole = vi.hoisted(() => vi.fn());
const mockFind = vi.hoisted(() => vi.fn());
const mockFindByID = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession,
    },
  },
}));

vi.mock("@/lib/auth/require-org", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/require-org")>();
  return {
    ...actual,
    getMemberRole: mockGetMemberRole,
    requireOrgRole: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/permissions/feature", () => ({
  isGranularPermissionsEnabled: () => true,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/audit/log", () => ({
  fireAndForgetAuditLog: vi.fn(),
}));

vi.mock("payload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("payload")>();
  return {
    ...actual,
    getPayload: vi.fn(async () => ({
      find: mockFind,
      findByID: mockFindByID,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    })),
  };
});

describe("permissions actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({
      user: { id: "actor-1", email: "a@test.com", name: "A" },
    });
  });

  it("grantPermissionAction creates when no row exists", async () => {
    mockGetMemberRole.mockResolvedValue("owner");
    mockFind.mockResolvedValue({ docs: [] });
    mockCreate.mockResolvedValue({ id: "perm-1" });

    const { grantPermissionAction } = await import("@/lib/actions/permissions");
    await grantPermissionAction({
      organizationId: "org-1",
      orgSlug: "acme",
      subjectId: "user-9",
      subjectType: "user",
      resourceType: "project",
      resourceId: "proj-1",
      actions: ["read"],
    });

    expect(mockCreate).toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("revokePermissionAction rejects cross-org row", async () => {
    mockFindByID.mockResolvedValue({
      id: "perm-1",
      organization: "other-org",
    });

    const { revokePermissionAction } = await import("@/lib/actions/permissions");
    await expect(
      revokePermissionAction({
        organizationId: "org-1",
        orgSlug: "acme",
        permissionId: "perm-1",
      }),
    ).rejects.toMatchObject({ name: "ForbiddenError" });
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("listPermissionsAction forbids non-admin member", async () => {
    mockGetMemberRole.mockResolvedValue("member");

    const { listPermissionsAction } = await import("@/lib/actions/permissions");
    await expect(
      listPermissionsAction({ organizationId: "org-1" }),
    ).rejects.toMatchObject({ name: "ForbiddenError" });
  });
});
