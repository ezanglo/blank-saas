import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { sendTransactionalEmail } from "@/lib/email/send";
import { clientIp } from "@/lib/proxy/request-meta";
import { apiRateLimiter } from "@/lib/quota/limiter";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(8000),
});

/**
 * Public contact form for the marketing site.
 * Set `CONTACT_INBOX` + SMTP in production; without them submissions are logged server-side only.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const { success, pending } = await apiRateLimiter.limit(`contact:${ip}`);
  if (pending) await pending;
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot — hidden field; must stay empty for humans.
  if (
    typeof raw === "object" &&
    raw !== null &&
    "_hp" in raw &&
    String((raw as { _hp?: unknown })._hp ?? "").trim() !== ""
  ) {
    return NextResponse.json({ ok: true, delivered: false });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const { name, email, message } = parsed.data;
  const inbox = process.env.CONTACT_INBOX?.trim();
  const hasSmtp = Boolean(process.env.SMTP_HOST?.trim());

  const subject = `[Blank SaaS contact] ${name}`;
  const text = `From: ${name}\nEmail: ${email}\n\n${message}`;

  if (inbox && hasSmtp) {
    try {
      await sendTransactionalEmail({
        to: inbox,
        subject,
        text,
        replyTo: email,
      });
    } catch (err) {
      console.error("[contact] send failed", err);
      return NextResponse.json(
        { error: "Could not deliver message. Try again later." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true as const, delivered: true as const });
  }

  console.log("[contact] (SMTP or CONTACT_INBOX unset — not emailed)\n" + text);
  return NextResponse.json({ ok: true as const, delivered: false as const });
}
