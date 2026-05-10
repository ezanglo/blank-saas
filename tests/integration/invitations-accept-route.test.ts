import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError } from "@/lib/auth/require-org";

const mockAccept = vi.hoisted(() => vi.fn());

vi.mock("@/lib/actions/invitations", () => ({
  acceptInvitationAction: (...args: unknown[]) => mockAccept(...args),
}));

describe("integration: POST /api/invitations/accept", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 400 when invitationId is missing", async () => {
    const { POST } = await import("@/app/api/invitations/accept/route");
    const res = await POST(
      new NextRequest("http://localhost/api/invitations/accept", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
    expect(mockAccept).not.toHaveBeenCalled();
  });

  it("returns 403 when server action reports forbidden", async () => {
    mockAccept.mockRejectedValue(new ForbiddenError("Not signed in"));

    const { POST } = await import("@/app/api/invitations/accept/route");
    const res = await POST(
      new NextRequest("http://localhost/api/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ invitationId: "inv-1" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(403);
    expect(mockAccept).toHaveBeenCalledWith("inv-1");
  });

  it("returns JSON from acceptInvitationAction on success", async () => {
    mockAccept.mockResolvedValue({ ok: true, organizationId: "org-1" });

    const { POST } = await import("@/app/api/invitations/accept/route");
    const res = await POST(
      new NextRequest("http://localhost/api/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ invitationId: "  inv-2  " }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, organizationId: "org-1" });
    expect(mockAccept).toHaveBeenCalledWith("inv-2");
  });
});

describe("integration: GET /api/invitations/accept", () => {
  it("redirects to /invite/[id]", async () => {
    const { GET } = await import("@/app/api/invitations/accept/route");
    const res = await GET(
      new NextRequest(
        "http://localhost:3000/api/invitations/accept?invitationId=abc-123",
      ),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/invite/abc-123");
  });

  it("returns 400 when invitationId query missing", async () => {
    const { GET } = await import("@/app/api/invitations/accept/route");
    const res = await GET(new NextRequest("http://localhost/api/invitations/accept"));
    expect(res.status).toBe(400);
  });
});
