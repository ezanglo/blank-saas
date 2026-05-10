import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireOrgAdminSession = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/require-org-api", () => ({
  requireOrgAdminSession: (...args: unknown[]) => mockRequireOrgAdminSession(...args),
}));

vi.mock("@/lib/permissions/feature", () => ({
  isGranularPermissionsEnabled: vi.fn(),
}));

vi.mock("@/lib/permissions/list", () => ({
  listOrgPermissions: vi.fn(),
}));

vi.mock("@/lib/billing/portal", () => ({
  createBillingPortalSessionUrl: vi.fn(),
}));

vi.mock("@/lib/quota/check", () => ({
  consumeMonthlyQuota: vi.fn(),
}));

vi.mock("@/lib/org/plan", () => ({
  getOrgPlan: vi.fn(),
}));

vi.mock("@/lib/audit/list", () => ({
  listAuditLogs: vi.fn(),
}));

const orgId = "00000000-0000-4000-8000-000000000002";

describe("integration: org API routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/orgs/[orgId]/permissions", () => {
    beforeEach(async () => {
      const { isGranularPermissionsEnabled } = await import("@/lib/permissions/feature");
      vi.mocked(isGranularPermissionsEnabled).mockReturnValue(true);
      const { listOrgPermissions } = await import("@/lib/permissions/list");
      vi.mocked(listOrgPermissions).mockResolvedValue({
        docs: [],
        totalDocs: 0,
        totalPages: 1,
        page: 1,
      });
    });

    it("returns 404 when granular permissions feature is disabled", async () => {
      const { isGranularPermissionsEnabled } = await import("@/lib/permissions/feature");
      vi.mocked(isGranularPermissionsEnabled).mockReturnValue(false);

      const { GET } = await import("@/app/api/orgs/[orgId]/permissions/route");
      const res = await GET(new Request(`http://localhost/api/orgs/${orgId}/permissions`), {
        params: Promise.resolve({ orgId }),
      });

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Not found" });
      expect(mockRequireOrgAdminSession).not.toHaveBeenCalled();
    });

    it("returns gate response when session is not an org admin", async () => {
      mockRequireOrgAdminSession.mockResolvedValue({
        ok: false,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const { GET } = await import("@/app/api/orgs/[orgId]/permissions/route");
      const res = await GET(new Request(`http://localhost/api/orgs/${orgId}/permissions`), {
        params: Promise.resolve({ orgId }),
      });

      expect(res.status).toBe(403);
      expect(mockRequireOrgAdminSession).toHaveBeenCalledWith(orgId, {
        resourceType: "org_permissions",
        action: "read",
      });
    });

    it("returns JSON from listOrgPermissions for authorized callers", async () => {
      mockRequireOrgAdminSession.mockResolvedValue({
        ok: true,
        session: { user: { id: "admin-1" } } as never,
        role: "admin",
      });

      const { GET } = await import("@/app/api/orgs/[orgId]/permissions/route");
      const url = new URL(`http://localhost/api/orgs/${orgId}/permissions`);
      url.searchParams.set("resourceType", "org_team");
      url.searchParams.set("page", "2");

      const res = await GET(new Request(url.toString()), {
        params: Promise.resolve({ orgId }),
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({
        docs: [],
        totalDocs: 0,
        totalPages: 1,
        page: 1,
      });

      const { listOrgPermissions } = await import("@/lib/permissions/list");
      expect(listOrgPermissions).toHaveBeenCalledWith({
        organizationId: orgId,
        resourceType: "org_team",
        resourceId: undefined,
        subjectId: undefined,
        page: 2,
      });
    });
  });

  describe("GET /api/billing/portal", () => {
    beforeEach(async () => {
      const { createBillingPortalSessionUrl } = await import("@/lib/billing/portal");
      vi.mocked(createBillingPortalSessionUrl).mockResolvedValue(
        "https://billing.stripe.com/session/test",
      );
    });

    it("returns 400 when orgId query param is missing", async () => {
      const { GET } = await import("@/app/api/billing/portal/route");
      const res = await GET(new Request("http://localhost/api/billing/portal"));

      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: expect.stringContaining("orgId") });
      expect(mockRequireOrgAdminSession).not.toHaveBeenCalled();
    });

    it("returns gate response when billing portal is not allowed", async () => {
      mockRequireOrgAdminSession.mockResolvedValue({
        ok: false,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const { GET } = await import("@/app/api/billing/portal/route");
      const res = await GET(
        new Request(`http://localhost/api/billing/portal?orgId=${encodeURIComponent(orgId)}`),
      );

      expect(res.status).toBe(403);
      expect(mockRequireOrgAdminSession).toHaveBeenCalledWith(orgId, {
        resourceType: "org_billing",
        action: "read",
      });
    });

    it("redirects to Stripe portal URL when allowed", async () => {
      mockRequireOrgAdminSession.mockResolvedValue({
        ok: true,
        session: { user: { id: "admin-1" } } as never,
        role: "admin",
      });

      const { GET } = await import("@/app/api/billing/portal/route");
      const res = await GET(
        new Request(`http://localhost/api/billing/portal?orgId=${encodeURIComponent(orgId)}`),
      );

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("https://billing.stripe.com/session/test");
    });
  });

  describe("GET /api/orgs/[orgId]/audit-logs/export", () => {
    it("returns gate response without touching quota when export is forbidden", async () => {
      mockRequireOrgAdminSession.mockResolvedValue({
        ok: false,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const { consumeMonthlyQuota } = await import("@/lib/quota/check");
      const { GET } = await import("@/app/api/orgs/[orgId]/audit-logs/export/route");
      const res = await GET(new NextRequest(`http://localhost/api/orgs/${orgId}/audit-logs/export`), {
        params: Promise.resolve({ orgId }),
      });

      expect(res.status).toBe(403);
      expect(mockRequireOrgAdminSession).toHaveBeenCalledWith(orgId, {
        resourceType: "org_audit_logs",
        action: "export",
      });
      expect(consumeMonthlyQuota).not.toHaveBeenCalled();
    });
  });
});
