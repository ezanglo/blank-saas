import { Webhook } from "svix";

/**
 * Svix operational webhooks (e.g. endpoint health). Verify signature with `SVIX_WEBHOOK_SECRET`
 * from the Svix dashboard (Phase 6 / PRD §14.8).
 */
export async function POST(req: Request) {
  const secret = process.env.SVIX_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("SVIX_WEBHOOK_SECRET not configured", { status: 501 });
  }

  const payload = await req.text();
  const wh = new Webhook(secret);

  try {
    wh.verify(payload, {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    });
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  return new Response("ok", { status: 200 });
}
