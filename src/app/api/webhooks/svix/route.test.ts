import { describe, expect, it, afterEach } from "vitest";
import { Webhook } from "svix";

import { POST } from "./route";

describe("POST /api/webhooks/svix", () => {
  const secret = `whsec_${Buffer.from("svix-test-secret-pad-01").toString("base64")}`;
  const saved = process.env.SVIX_WEBHOOK_SECRET;

  afterEach(() => {
    process.env.SVIX_WEBHOOK_SECRET = saved;
  });

  it("rejects when secret missing", async () => {
    delete process.env.SVIX_WEBHOOK_SECRET;
    const res = await POST(new Request("http://localhost/api/webhooks/svix", { method: "POST", body: "{}" }));
    expect(res.status).toBe(501);
  });

  it("accepts signed payload", async () => {
    process.env.SVIX_WEBHOOK_SECRET = secret;
    const wh = new Webhook(secret);
    const body = JSON.stringify({ type: "endpoint.disabled" });
    const msgId = "msg_123";
    const timestamp = new Date();
    const signature = wh.sign(msgId, timestamp, Buffer.from(body));
    const res = await POST(
      new Request("http://localhost/api/webhooks/svix", {
        method: "POST",
        body,
        headers: {
          "content-type": "application/json",
          "svix-id": msgId,
          "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
          "svix-signature": signature,
        },
      }),
    );
    expect(res.status).toBe(200);
  });
});
