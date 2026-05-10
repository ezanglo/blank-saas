import Stripe from "stripe";
import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mockProcess = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/billing/process-webhook", () => ({
  processStripeWebhookEvent: mockProcess,
}));

describe("POST /api/webhooks/stripe", () => {
  const secret = "whsec_test_secret";
  const savedSecret = process.env.STRIPE_WEBHOOK_SECRET;

  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = savedSecret;
    mockProcess.mockClear();
  });

  it("returns 501 when webhook secret missing", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(
      new Request("http://localhost/api/webhooks/stripe", { method: "POST", body: "{}" }),
    );
    expect(res.status).toBe(501);
  });

  it("returns 400 without stripe-signature", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    const res = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid signature", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    const res = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "bad" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("accepts signed payload and runs processor", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    const stripe = new Stripe("sk_test_fake", { apiVersion: Stripe.API_VERSION });
    const payload = {
      id: "evt_test_123",
      object: "event",
      type: "ping",
      data: { object: { id: "x" } },
    };
    const body = JSON.stringify(payload);
    const header = stripe.webhooks.generateTestHeaderString({
      payload: body,
      secret,
    });

    const res = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body,
        headers: { "stripe-signature": header },
      }),
    );

    expect(res.status).toBe(200);
    expect(mockProcess).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when processor throws", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    mockProcess.mockRejectedValueOnce(new Error("db down"));
    const stripe = new Stripe("sk_test_fake", { apiVersion: Stripe.API_VERSION });
    const payload = { id: "evt_test_456", object: "event", type: "ping", data: { object: {} } };
    const body = JSON.stringify(payload);
    const header = stripe.webhooks.generateTestHeaderString({ payload: body, secret });

    const res = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body,
        headers: { "stripe-signature": header },
      }),
    );

    expect(res.status).toBe(500);
  });
});
