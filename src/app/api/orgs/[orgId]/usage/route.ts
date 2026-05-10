import { NextResponse } from "next/server";

import { requireOrgMemberSession } from "@/lib/auth/require-org-api";
import { getOrgPlan } from "@/lib/org/plan";
import { getOrgUsageSummary } from "@/lib/quota/usage-summary";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await ctx.params;
  const gate = await requireOrgMemberSession(orgId);
  if (!gate.ok) return gate.response;

  const plan = await getOrgPlan(orgId);
  const usage = await getOrgUsageSummary(orgId, plan);

  return NextResponse.json({ plan, usage });
}
