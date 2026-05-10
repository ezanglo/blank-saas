import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const mockGetMemberRole = vi.hoisted(() => vi.fn());
const createInvitation = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession,
      createInvitation,
    },
  },
}));

vi.mock("@/lib/auth/require-org", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/require-org")>();
  return {
    ...actual,
    getMemberRole: mockGetMemberRole,
  };
});

vi.mock("@/lib/permissions/feature", () => ({
  isGranularPermissionsEnabled: () => false,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/audit/log", () => ({
  fireAndForgetAuditLog: vi.fn(),
}));

vi.mock("@/lib/webhooks/send", () => ({
  sendWebhookFireAndForget: vi.fn(),
}));

vi.mock("@/lib/analytics/server", () => ({
  captureServerEvent: vi.fn(),
}));

vi.mock("@/lib/org/plan", () => ({
  getOrgPlan: vi.fn(async () => "free"),
}));

vi.mock("@/lib/quota/check", () => ({
  checkQuota: vi.fn(async () => ({ allowed: true })),
}));

describe("integration: inviteMemberAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({
      user: { id: "inviter-1", email: "i@test.com", name: "I" },
    });
    createInvitation.mockResolvedValue({ ok: true });
  });

  it("calls Better Auth createInvitation when inviter is admin", async () => {
    mockGetMemberRole.mockResolvedValue("admin");
    const { inviteMemberAction } = await import("@/lib/actions/member");

    await inviteMemberAction({
      organizationId: "org-1",
      email: "New@Test.COM ",
      role: "member",
    });

    expect(createInvitation).toHaveBeenCalledTimes(1);
    const arg = createInvitation.mock.calls[0][0] as {
      body: { email: string; organizationId: string; role: string };
    };
    expect(arg.body.email).toBe("new@test.com");
    expect(arg.body.organizationId).toBe("org-1");
    expect(arg.body.role).toBe("member");
  });

  it("forbids plain member when granular permissions feature is off", async () => {
    mockGetMemberRole.mockResolvedValue("member");
    const { inviteMemberAction } = await import("@/lib/actions/member");

    await expect(
      inviteMemberAction({
        organizationId: "org-1",
        email: "new@test.com",
        role: "member",
      }),
    ).rejects.toMatchObject({ name: "ForbiddenError" });

    expect(createInvitation).not.toHaveBeenCalled();
  });
});
