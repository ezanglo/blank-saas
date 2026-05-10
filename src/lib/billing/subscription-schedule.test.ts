import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  subscriptionsRetrieve: vi.fn(),
  schedulesCreate: vi.fn(),
  schedulesRetrieve: vi.fn(),
  schedulesUpdate: vi.fn(),
  schedulesRelease: vi.fn(),
}));

vi.mock("@/lib/billing/stripe", () => ({
  stripe: {
    subscriptions: {
      retrieve: mocks.subscriptionsRetrieve,
    },
    subscriptionSchedules: {
      create: mocks.schedulesCreate,
      retrieve: mocks.schedulesRetrieve,
      update: mocks.schedulesUpdate,
      release: mocks.schedulesRelease,
    },
  },
}));

import {
  releaseSubscriptionScheduleIfPresent,
  scheduleSubscriptionDowngradeAtPeriodEnd,
  subscriptionScheduleId,
} from "@/lib/billing/subscription-schedule";

describe("subscriptionScheduleId", () => {
  it("reads string schedule id", () => {
    expect(subscriptionScheduleId({ schedule: "sched_1" } as never)).toBe("sched_1");
  });

  it("reads expanded schedule object", () => {
    expect(subscriptionScheduleId({ schedule: { id: "sched_2" } } as never)).toBe("sched_2");
  });

  it("returns null when absent", () => {
    expect(subscriptionScheduleId({ schedule: null } as never)).toBeNull();
  });
});

describe("releaseSubscriptionScheduleIfPresent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not call release when subscription has no schedule", async () => {
    mocks.subscriptionsRetrieve.mockResolvedValue({
      id: "sub_1",
      schedule: null,
    });

    await releaseSubscriptionScheduleIfPresent("sub_1");

    expect(mocks.schedulesRelease).not.toHaveBeenCalled();
  });

  it("releases when schedule id is present", async () => {
    mocks.subscriptionsRetrieve.mockResolvedValue({
      id: "sub_1",
      schedule: "sched_x",
    });

    await releaseSubscriptionScheduleIfPresent("sub_1");

    expect(mocks.schedulesRelease).toHaveBeenCalledWith("sched_x");
  });
});

describe("scheduleSubscriptionDowngradeAtPeriodEnd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a schedule from_subscription when none exists", async () => {
    mocks.subscriptionsRetrieve.mockResolvedValueOnce({
      id: "sub_1",
      schedule: null,
      items: {
        data: [{ current_period_start: 1000, current_period_end: 2000 }],
      },
    });
    mocks.schedulesCreate.mockResolvedValue({ id: "sched_new" });
    mocks.schedulesRetrieve.mockResolvedValue({
      id: "sched_new",
      phases: [{ start_date: 1000 }],
    });
    mocks.schedulesUpdate.mockResolvedValue({});

    const result = await scheduleSubscriptionDowngradeAtPeriodEnd({
      subscriptionId: "sub_1",
      currentPriceId: "price_cur",
      newPriceId: "price_next",
      phaseMetadata: { orgId: "org_1" },
    });

    expect(result).toEqual({ periodEndUnix: 2000 });
    expect(mocks.schedulesCreate).toHaveBeenCalledWith({ from_subscription: "sub_1" });
    expect(mocks.schedulesUpdate).toHaveBeenCalledWith("sched_new", {
      end_behavior: "release",
      phases: [
        {
          start_date: 1000,
          end_date: 2000,
          items: [{ price: "price_cur", quantity: 1 }],
          metadata: { orgId: "org_1" },
        },
        {
          start_date: 2000,
          items: [{ price: "price_next", quantity: 1 }],
          metadata: { orgId: "org_1" },
          proration_behavior: "none",
        },
      ],
    });
  });

  it("reuses existing schedule id", async () => {
    mocks.subscriptionsRetrieve.mockResolvedValueOnce({
      id: "sub_1",
      schedule: "sched_existing",
      items: {
        data: [{ current_period_start: 10, current_period_end: 99 }],
      },
    });
    mocks.schedulesRetrieve.mockResolvedValue({
      id: "sched_existing",
      phases: [{ start_date: 5 }],
    });
    mocks.schedulesUpdate.mockResolvedValue({});

    await scheduleSubscriptionDowngradeAtPeriodEnd({
      subscriptionId: "sub_1",
      currentPriceId: "a",
      newPriceId: "b",
      phaseMetadata: {},
    });

    expect(mocks.schedulesCreate).not.toHaveBeenCalled();
    expect(mocks.schedulesUpdate).toHaveBeenCalledWith(
      "sched_existing",
      expect.objectContaining({
        phases: [
          expect.objectContaining({ start_date: 5, end_date: 99 }),
          expect.objectContaining({ start_date: 99 }),
        ],
      }),
    );
  });
});
