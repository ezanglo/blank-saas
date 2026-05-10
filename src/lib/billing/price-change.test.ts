import { describe, expect, it } from "vitest";

import {
  FREE_PLAN_SELECTION_ID,
  priceChangeKind,
  priceTierIndex,
} from "@/lib/billing/price-change";
import type { StripePricesResolved } from "@/lib/billing/plans";

const catalog: StripePricesResolved = {
  pro: { monthly: "price_pro_m", yearly: "price_pro_y" },
  enterprise: { monthly: "price_ent_m" },
};

describe("priceTierIndex", () => {
  it("orders pro monthly < pro yearly < enterprise", () => {
    expect(priceTierIndex("price_pro_m", catalog)).toBe(0);
    expect(priceTierIndex("price_pro_y", catalog)).toBe(1);
    expect(priceTierIndex("price_ent_m", catalog)).toBe(2);
    expect(priceTierIndex("price_unknown", catalog)).toBe(-1);
  });
});

describe("priceChangeKind", () => {
  it("classifies moves along the catalog", () => {
    expect(priceChangeKind("price_pro_m", "price_ent_m", catalog)).toBe("upgrade");
    expect(priceChangeKind("price_ent_m", "price_pro_m", catalog)).toBe("downgrade");
    expect(priceChangeKind("price_pro_m", "price_pro_y", catalog)).toBe("upgrade");
    expect(priceChangeKind("price_pro_y", "price_pro_m", catalog)).toBe("downgrade");
    expect(priceChangeKind("price_pro_m", "price_pro_m", catalog)).toBe("same");
  });

  it("treats missing current as upgrade (new paid)", () => {
    expect(priceChangeKind(null, "price_pro_m", catalog)).toBe("upgrade");
  });

  it("treats switch to Free as downgrade when there is a paid price", () => {
    expect(priceChangeKind("price_pro_m", FREE_PLAN_SELECTION_ID, catalog)).toBe("downgrade");
    expect(priceChangeKind(null, FREE_PLAN_SELECTION_ID, catalog)).toBe("same");
  });
});
