import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDbState = vi.hoisted(() => {
  let rows: unknown[] = [];
  return {
    setRows(next: unknown[]) {
      rows = next;
    },
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => rows),
          })),
        })),
      })),
    },
  };
});

vi.mock("@/lib/db", () => ({
  db: mockDbState.db,
}));

import { domainHasSamlSsoAction } from "@/lib/actions/sso-domain";

describe("domainHasSamlSsoAction", () => {
  beforeEach(() => {
    mockDbState.setRows([]);
    mockDbState.db.select.mockClear();
  });

  it("returns false when input cannot yield a domain", async () => {
    await expect(domainHasSamlSsoAction("   ")).resolves.toBe(false);
    expect(mockDbState.db.select).not.toHaveBeenCalled();
  });

  it("returns true when an SSO provider exists for the email domain", async () => {
    mockDbState.setRows([{ id: "prov-1" }]);
    await expect(domainHasSamlSsoAction("User@ACME.COM")).resolves.toBe(true);
  });

  it("returns false when no SSO provider matches", async () => {
    mockDbState.setRows([]);
    await expect(domainHasSamlSsoAction("u@unknown.example")).resolves.toBe(false);
  });
});
