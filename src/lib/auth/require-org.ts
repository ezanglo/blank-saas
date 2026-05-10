import { and, eq } from "@payloadcms/db-postgres/drizzle";

import { db } from "@/lib/db";
import * as schema from "@/payload-generated-schema";

export class ForbiddenError extends Error {
  override readonly name = "ForbiddenError";

  constructor(message = "Forbidden") {
    super(message);
  }
}

const rank: Record<string, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

export async function getMemberRole(organizationId: string, userId: string) {
  const [row] = await db
    .select({ role: schema.members.role })
    .from(schema.members)
    .where(
      and(
        eq(schema.members.organization, organizationId),
        eq(schema.members.user, userId),
      ),
    )
    .limit(1);
  return row?.role ?? null;
}

export async function requireOrgRole(params: {
  organizationId: string;
  userId: string;
  min: "member" | "admin" | "owner";
}) {
  const role = await getMemberRole(params.organizationId, params.userId);
  const r = typeof role === "string" ? rank[role] : 0;
  if (r < rank[params.min]) {
    throw new ForbiddenError();
  }
}
