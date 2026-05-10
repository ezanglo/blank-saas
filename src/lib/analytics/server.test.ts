import { afterEach, describe, expect, it, vi } from "vitest";

const posthogNodeMock = vi.hoisted(() => {
  const capture = vi.fn();
  const flush = vi.fn().mockResolvedValue(undefined);
  const _shutdown = vi.fn().mockResolvedValue(undefined);
  const PostHog = vi.fn(function MockPostHog(this: {
    capture: typeof capture;
    flush: typeof flush;
    _shutdown: typeof _shutdown;
  }) {
    this.capture = capture;
    this.flush = flush;
    this._shutdown = _shutdown;
  });
  return { capture, flush, _shutdown, PostHog };
});

vi.mock("posthog-node", () => ({
  PostHog: posthogNodeMock.PostHog,
}));

describe("analytics server", () => {
  afterEach(async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    vi.resetModules();
    posthogNodeMock.capture.mockClear();
    posthogNodeMock.flush.mockClear();
    posthogNodeMock._shutdown.mockClear();
    posthogNodeMock.PostHog.mockClear();
  });

  it("captureServerEvent no-ops when NEXT_PUBLIC_POSTHOG_KEY is unset", async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const { captureServerEvent, shutdownAnalytics } = await import("./server");
    expect(() =>
      captureServerEvent({ distinctId: "user-1", event: "test_event" }),
    ).not.toThrow();
    expect(posthogNodeMock.PostHog).not.toHaveBeenCalled();
    await shutdownAnalytics();
  });

  it("captureServerEvent forwards to posthog-node when key is set", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key";
    const { captureServerEvent, shutdownAnalytics } = await import("./server");
    captureServerEvent({
      distinctId: "user-1",
      event: "org_created",
      properties: { orgId: "o1" },
      groups: { company: "o1" },
    });
    expect(posthogNodeMock.PostHog).toHaveBeenCalledTimes(1);
    expect(posthogNodeMock.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        distinctId: "user-1",
        event: "org_created",
        properties: { orgId: "o1" },
        groups: { company: "o1" },
      }),
    );
    await shutdownAnalytics();
    expect(posthogNodeMock.flush).toHaveBeenCalled();
    expect(posthogNodeMock._shutdown).toHaveBeenCalled();
  });
});
