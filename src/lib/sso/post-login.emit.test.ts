import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDbState = vi.hoisted(() => {
  let sequences: unknown[][] = [];
  let i = 0;
  return {
    reset(rows: unknown[][]) {
      sequences = rows;
      i = 0;
    },
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => {
              const chunk = sequences[i] ?? [];
              i += 1;
              return chunk;
            }),
          })),
        })),
      })),
    },
  };
});

vi.mock("@/lib/db", () => ({
  db: mockDbState.db,
}));

const captureServerEvent = vi.hoisted(() => vi.fn());
vi.mock("@/lib/analytics/server", () => ({
  captureServerEvent,
}));

const fireAndForgetAuditLog = vi.hoisted(() => vi.fn());
vi.mock("@/lib/audit/log", () => ({
  fireAndForgetAuditLog,
}));

import { SSO_LOGIN } from "@/lib/analytics/events";
import { emitSsoLoginAuditAndAnalytics } from "@/lib/sso/post-login";

describe("emitSsoLoginAuditAndAnalytics", () => {
  beforeEach(() => {
    mockDbState.reset([]);
    captureServerEvent.mockClear();
    fireAndForgetAuditLog.mockClear();
    mockDbState.db.select.mockClear();
  });

  it("writes org-scoped audit when org.samlConnectionId matches providerId", async () => {
    mockDbState.reset([
      [{ id: "org-1", name: "Acme" }],
      [{ issuer: "https://idp.acme.test/meta", domain: "acme.com" }],
    ]);

    await emitSsoLoginAuditAndAnalytics({
      userId: "user-1",
      userEmail: "u@acme.com",
      providerId: "sso-org-uuid",
    });

    expect(fireAndForgetAuditLog).toHaveBeenCalledWith(
      "auth.sso_login",
      expect.objectContaining({
        organizationId: "org-1",
        actorId: "user-1",
        actorEmail: "u@acme.com",
        metadata: { idpName: "idp.acme.test" },
      }),
    );
    expect(captureServerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        distinctId: "user-1",
        event: SSO_LOGIN,
        groups: { company: "org-1" },
        properties: expect.objectContaining({
          providerId: "sso-org-uuid",
          orgId: "org-1",
          orgName: "Acme",
        }),
      }),
    );
  });

  it("skips audit when no org row but still captures analytics", async () => {
    mockDbState.reset([[], [{ issuer: "urn:idp:local", domain: "solo.dev" }]]);

    await emitSsoLoginAuditAndAnalytics({
      userId: "user-2",
      userEmail: "x@solo.dev",
      providerId: "sso-orphan",
    });

    expect(fireAndForgetAuditLog).not.toHaveBeenCalled();
    expect(captureServerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        distinctId: "user-2",
        event: SSO_LOGIN,
        properties: expect.objectContaining({
          providerId: "sso-orphan",
          idpName: "urn:idp:local",
        }),
      }),
    );
    expect(
      (captureServerEvent.mock.calls[0][0] as { groups?: unknown }).groups,
    ).toBeUndefined();
  });
});
