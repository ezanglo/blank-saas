import { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

vi.mock("@/lib/auth/require-org-api", () => ({
  requireOrgMemberSession: vi.fn(),
}));

vi.mock("@/lib/org/plan", () => ({
  getOrgPlan: vi.fn(),
}));

vi.mock("@/lib/quota/usage-summary", () => ({
  getOrgUsageSummary: vi.fn(),
}));

import { requireOrgMemberSession } from "@/lib/auth/require-org-api";
import { getOrgPlan } from "@/lib/org/plan";
import { getOrgUsageSummary } from "@/lib/quota/usage-summary";

const orgId = "00000000-0000-4000-8000-000000000001";

const sampleUsage = {
  apiCallsPerMonth: { used: 2, limit: 1000, remaining: 998 },
  membersPerOrg: { used: 1, limit: 5, remaining: 4 },
  storageGb: { used: 0, limit: 1, remaining: 1 },
  webhookEndpoints: { used: 0, limit: 3, remaining: 3 },
};

describe("GET /api/orgs/[orgId]/usage", () => {
  beforeEach(() => {
    vi.mocked(requireOrgMemberSession).mockReset();
    vi.mocked(getOrgPlan).mockReset();
    vi.mocked(getOrgUsageSummary).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    vi.mocked(requireOrgMemberSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await GET(new Request("http://localhost/api/orgs/x/usage"), {
      params: Promise.resolve({ orgId }),
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(getOrgPlan).not.toHaveBeenCalled();
  });

  it("returns 403 when the user is not a member of the org", async () => {
    vi.mocked(requireOrgMemberSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    });

    const res = await GET(new Request("http://localhost/api/orgs/x/usage"), {
      params: Promise.resolve({ orgId }),
    });

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
    expect(getOrgUsageSummary).not.toHaveBeenCalled();
  });

  it("returns plan and usage for an org member", async () => {
    vi.mocked(requireOrgMemberSession).mockResolvedValue({
      ok: true,
      session: { user: { id: "user-1" } } as never,
      role: "member",
    });
    vi.mocked(getOrgPlan).mockResolvedValue("free");
    vi.mocked(getOrgUsageSummary).mockResolvedValue(sampleUsage);

    const res = await GET(new Request("http://localhost/api/orgs/x/usage"), {
      params: Promise.resolve({ orgId }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { plan: string; usage: typeof sampleUsage };
    expect(body.plan).toBe("free");
    expect(body.usage).toEqual(sampleUsage);
    expect(requireOrgMemberSession).toHaveBeenCalledWith(orgId);
    expect(getOrgPlan).toHaveBeenCalledWith(orgId);
    expect(getOrgUsageSummary).toHaveBeenCalledWith(orgId, "free");
  });
});
