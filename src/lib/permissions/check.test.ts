import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkPermission, permissionCheckWhere, resolveResourceAccess } from "./check";

const mockFind = vi.fn();

vi.mock("payload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("payload")>();
  return {
    ...actual,
    getPayload: vi.fn(async () => ({ find: mockFind })),
  };
});

describe("permissionCheckWhere", () => {
  it("includes user subject and org_role when userRole set", () => {
    const q = permissionCheckWhere({
      orgId: "org-1",
      userId: "u1",
      userRole: "admin",
      resourceType: "project",
      resourceId: "p1",
      action: "read",
    });
    expect(q.and).toBeDefined();
    const and = q.and as unknown[];
    expect(and.length).toBeGreaterThan(3);
  });

  it("omits org_role branch when userRole missing", () => {
    const q = permissionCheckWhere({
      orgId: "org-1",
      userId: "u1",
      resourceType: "project",
      resourceId: "p1",
      action: "read",
    });
    const last = (q.and as unknown[])[(q.and as unknown[]).length - 1] as {
      or: unknown[];
    };
    expect(last.or).toHaveLength(1);
  });
});

describe("checkPermission", () => {
  beforeEach(() => {
    mockFind.mockReset();
  });

  it("returns allowed when an action matches", async () => {
    mockFind.mockResolvedValue({
      docs: [{ actions: ["read", "write"] }],
    });
    const { allowed } = await checkPermission({
      orgId: "o1",
      userId: "u1",
      userRole: "member",
      resourceType: "project",
      resourceId: "p1",
      action: "write",
    });
    expect(allowed).toBe(true);
    expect(mockFind).toHaveBeenCalled();
  });

  it("returns not allowed when action missing", async () => {
    mockFind.mockResolvedValue({
      docs: [{ actions: ["read"] }],
    });
    const { allowed } = await checkPermission({
      orgId: "o1",
      userId: "u1",
      resourceType: "project",
      resourceId: "p1",
      action: "delete",
    });
    expect(allowed).toBe(false);
  });
});

describe("resolveResourceAccess (§32.8)", () => {
  it("short-circuits when RBAC allows", async () => {
    const granular = vi.fn();
    const { allowed } = await resolveResourceAccess({
      rbacAllows: true,
      granular: async () => {
        granular();
        return { allowed: true };
      },
    });
    expect(allowed).toBe(true);
    expect(granular).not.toHaveBeenCalled();
  });

  it("calls granular when RBAC denies", async () => {
    const { allowed } = await resolveResourceAccess({
      rbacAllows: false,
      granular: async () => ({ allowed: true }),
    });
    expect(allowed).toBe(true);
  });
});
