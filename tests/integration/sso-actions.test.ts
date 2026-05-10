import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError } from "@/lib/auth/require-org";

const getSession = vi.hoisted(() => vi.fn());
const registerSSOProvider = vi.hoisted(() => vi.fn());
const deleteSSOProvider = vi.hoisted(() => vi.fn());
const mockGetMemberRole = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession,
      registerSSOProvider,
      deleteSSOProvider,
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

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const fireAndForgetAuditLog = vi.hoisted(() => vi.fn());
vi.mock("@/lib/audit/log", () => ({
  fireAndForgetAuditLog,
}));

const dbMock = vi.hoisted(() => {
  let limitChunks: unknown[][] = [];
  let limitIdx = 0;
  const lastUpdatePayload = { value: null as Record<string, unknown> | null };
  return {
    reset(selectSequences: unknown[][]) {
      limitChunks = selectSequences;
      limitIdx = 0;
      lastUpdatePayload.value = null;
    },
    lastUpdatePayload() {
      return lastUpdatePayload.value;
    },
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => {
              const row = limitChunks[limitIdx] ?? [];
              limitIdx += 1;
              return row;
            }),
          })),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn((data: Record<string, unknown>) => {
          lastUpdatePayload.value = data;
          return {
            where: vi.fn(() => Promise.resolve(undefined)),
          };
        }),
      })),
    },
  };
});

vi.mock("@/lib/db", () => ({
  db: dbMock.db,
}));

const orgId = "550e8400-e29b-41d4-a716-446655440001";
const orgSlug = "acme";
const ownerUserId = "550e8400-e29b-41d4-a716-446655440002";

const minimalMetadataXml = `<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://idp.example.com/metadata"></EntityDescriptor>`;

describe("SSO server actions (integration-style)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    dbMock.reset([]);
    getSession.mockResolvedValue({
      user: {
        id: ownerUserId,
        email: "owner@acme.com",
        name: "Owner",
      },
    });
    mockGetMemberRole.mockResolvedValue("owner");
    registerSSOProvider.mockResolvedValue(undefined);
    deleteSSOProvider.mockResolvedValue(undefined);
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  describe("createOrgSamlConnectionAction", () => {
    it("rejects non-owner members", async () => {
      mockGetMemberRole.mockResolvedValue("member");
      const { createOrgSamlConnectionAction } = await import("@/lib/actions/sso");
      await expect(
        createOrgSamlConnectionAction({
          organizationId: orgId,
          orgSlug,
          domain: "acme.com",
          metadataXml: minimalMetadataXml,
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
      expect(registerSSOProvider).not.toHaveBeenCalled();
    });

    it("rejects unauthenticated callers", async () => {
      getSession.mockResolvedValue(null);
      const { createOrgSamlConnectionAction } = await import("@/lib/actions/sso");
      await expect(
        createOrgSamlConnectionAction({
          organizationId: orgId,
          orgSlug,
          domain: "acme.com",
          metadataXml: minimalMetadataXml,
        }),
      ).rejects.toMatchObject({ name: "ForbiddenError" });
      expect(registerSSOProvider).not.toHaveBeenCalled();
    });

    it("registers IdP with Better Auth and persists org samlConnectionId", async () => {
      dbMock.reset([
        [{ id: orgId, samlConnectionId: null }],
        [],
      ]);
      const { revalidatePath } = await import("next/cache");
      const { createOrgSamlConnectionAction } = await import("@/lib/actions/sso");

      await createOrgSamlConnectionAction({
        organizationId: orgId,
        orgSlug,
        domain: "acme.com",
        metadataXml: minimalMetadataXml,
      });

      expect(registerSSOProvider).toHaveBeenCalledTimes(1);
      const call = registerSSOProvider.mock.calls[0][0] as {
        body: { providerId: string; domain: string; organizationId: string };
      };
      expect(call.body.providerId).toBe(`sso-${orgId}`);
      expect(call.body.domain).toBe("acme.com");
      expect(call.body.organizationId).toBe(orgId);

      expect(dbMock.lastUpdatePayload()?.samlConnectionId).toBe(`sso-${orgId}`);
      expect(fireAndForgetAuditLog).toHaveBeenCalledWith(
        "sso.connection_created",
        expect.objectContaining({
          organizationId: orgId,
          actorId: ownerUserId,
        }),
      );
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(
        `/organizations/${orgSlug}/settings/sso`,
      );
    });

    it("throws when org already has SAML", async () => {
      dbMock.reset([[{ id: orgId, samlConnectionId: `sso-${orgId}` }]]);
      const { createOrgSamlConnectionAction } = await import("@/lib/actions/sso");
      await expect(
        createOrgSamlConnectionAction({
          organizationId: orgId,
          orgSlug,
          domain: "acme.com",
          metadataXml: minimalMetadataXml,
        }),
      ).rejects.toThrow(/already has a SAML connection/);
      expect(registerSSOProvider).not.toHaveBeenCalled();
    });

    it("throws when SSO domain is taken", async () => {
      dbMock.reset([
        [{ id: orgId, samlConnectionId: null }],
        [{ id: "other-prov" }],
      ]);
      const { createOrgSamlConnectionAction } = await import("@/lib/actions/sso");
      await expect(
        createOrgSamlConnectionAction({
          organizationId: orgId,
          orgSlug,
          domain: "acme.com",
          metadataXml: minimalMetadataXml,
        }),
      ).rejects.toThrow(/already uses this SSO domain/);
      expect(registerSSOProvider).not.toHaveBeenCalled();
    });
  });

  describe("deleteOrgSamlConnectionAction", () => {
    it("no-ops when org has no connection", async () => {
      dbMock.reset([[{ id: orgId, samlConnectionId: null }]]);
      const { deleteOrgSamlConnectionAction } = await import("@/lib/actions/sso");
      await deleteOrgSamlConnectionAction({ organizationId: orgId, orgSlug });
      expect(deleteSSOProvider).not.toHaveBeenCalled();
      expect(dbMock.lastUpdatePayload()).toBeNull();
    });

    it("calls Better Auth delete and clears org samlConnectionId", async () => {
      const pid = `sso-${orgId}`;
      dbMock.reset([[{ id: orgId, samlConnectionId: pid }]]);
      const { revalidatePath } = await import("next/cache");
      const { deleteOrgSamlConnectionAction } = await import("@/lib/actions/sso");

      await deleteOrgSamlConnectionAction({ organizationId: orgId, orgSlug });

      expect(deleteSSOProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { providerId: pid },
        }),
      );
      expect(dbMock.lastUpdatePayload()?.samlConnectionId).toBeNull();
      expect(fireAndForgetAuditLog).toHaveBeenCalledWith(
        "sso.connection_deleted",
        expect.objectContaining({
          organizationId: orgId,
          metadata: { connectionId: pid },
        }),
      );
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(
        `/organizations/${orgSlug}/settings/sso`,
      );
    });
  });

  describe("loadOrgSamlSummaryForSettings", () => {
    it("returns disconnected when org has no samlConnectionId", async () => {
      dbMock.reset([[{ samlConnectionId: null }]]);
      const { loadOrgSamlSummaryForSettings } = await import("@/lib/actions/sso");
      await expect(loadOrgSamlSummaryForSettings(orgId)).resolves.toEqual({
        connected: false,
      });
    });

    it("returns SP URLs when connected", async () => {
      const pid = `sso-${orgId}`;
      dbMock.reset([
        [{ samlConnectionId: pid }],
        [{ issuer: "https://idp.example.com/metadata", domain: "acme.com" }],
      ]);
      const { loadOrgSamlSummaryForSettings } = await import("@/lib/actions/sso");
      const summary = await loadOrgSamlSummaryForSettings(orgId);
      expect(summary.connected).toBe(true);
      if (summary.connected) {
        expect(summary.providerId).toBe(pid);
        expect(summary.domain).toBe("acme.com");
        expect(summary.spMetadataUrl).toContain("/api/auth/sso/saml2/sp/metadata");
        expect(summary.acsUrl).toContain(`/sso/saml2/sp/acs/${encodeURIComponent(pid)}`);
      }
    });

    it("denies non-owners", async () => {
      mockGetMemberRole.mockResolvedValue("admin");
      dbMock.reset([]);
      const { loadOrgSamlSummaryForSettings } = await import("@/lib/actions/sso");
      await expect(loadOrgSamlSummaryForSettings(orgId)).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });
  });
});
