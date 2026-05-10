import { NextRequest, NextResponse } from "next/server";

import { acceptInvitationAction } from "@/lib/actions/invitations";
import { ForbiddenError } from "@/lib/auth/require-org";

/**
 * HTTP surface for accepting an invitation (same semantics as the invite UI + server action).
 * POST JSON `{ "invitationId": "<uuid>" }` with the user’s session cookies.
 * GET `?invitationId=<uuid>` redirects to `/invite/[invitationId]` for browser flows.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw =
    typeof body === "object" &&
    body !== null &&
    "invitationId" in body &&
    typeof (body as { invitationId: unknown }).invitationId === "string"
      ? (body as { invitationId: string }).invitationId
      : null;

  if (!raw?.trim()) {
    return NextResponse.json({ error: "invitationId required" }, { status: 400 });
  }

  try {
    const result = await acceptInvitationAction(raw.trim());
    return NextResponse.json(result ?? { ok: true });
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    console.error(e);
    return NextResponse.json({ error: "Accept failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("invitationId");
  if (!id?.trim()) {
    return NextResponse.json(
      {
        error: "Query invitationId is required",
        hint: "API clients should use POST with JSON body { invitationId }.",
      },
      { status: 400 },
    );
  }
  const url = new URL(`/invite/${encodeURIComponent(id.trim())}`, req.nextUrl.origin);
  return NextResponse.redirect(url);
}
