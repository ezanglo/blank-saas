import { NextResponse } from "next/server";

import { requireOrgAdminSession } from "@/lib/auth/require-org-api";
import { createBillingPortalSessionUrl } from "@/lib/billing/portal";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId")?.trim();
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  const gate = await requireOrgAdminSession(orgId, {
    resourceType: "org_billing",
    action: "read",
  });
  if (!gate.ok) return gate.response;

  let portalUrl: string;
  try {
    portalUrl = await createBillingPortalSessionUrl({ organizationId: orgId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Portal error";
    if (message.includes("No billing account")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("[billing] portal", err);
    return NextResponse.json({ error: "Could not open billing portal" }, { status: 500 });
  }

  return NextResponse.redirect(portalUrl);
}
