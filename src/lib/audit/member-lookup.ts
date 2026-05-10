import { and, eq } from "@payloadcms/db-postgres/drizzle";

import { db } from "@/lib/db";
import * as schema from "@/payload-generated-schema";

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function memberContactForAudit(
  organizationId: string,
  memberIdOrEmail: string,
): Promise<{ userId: string; email: string } | null> {
  const raw = memberIdOrEmail.trim();
  if (!raw) return null;

  if (uuidRe.test(raw)) {
    const [byMemberId] = await db
      .select({
        userId: schema.members.user,
        email: schema.users.email,
      })
      .from(schema.members)
      .innerJoin(schema.users, eq(schema.members.user, schema.users.id))
      .where(
        and(eq(schema.members.organization, organizationId), eq(schema.members.id, raw)),
      )
      .limit(1);
    if (byMemberId) {
      return { userId: byMemberId.userId, email: byMemberId.email };
    }
    const [byUserId] = await db
      .select({
        userId: schema.members.user,
        email: schema.users.email,
      })
      .from(schema.members)
      .innerJoin(schema.users, eq(schema.members.user, schema.users.id))
      .where(
        and(eq(schema.members.organization, organizationId), eq(schema.members.user, raw)),
      )
      .limit(1);
    return byUserId ? { userId: byUserId.userId, email: byUserId.email } : null;
  }

  const [byEmail] = await db
    .select({
      userId: schema.members.user,
      email: schema.users.email,
    })
    .from(schema.members)
    .innerJoin(schema.users, eq(schema.members.user, schema.users.id))
    .where(
      and(
        eq(schema.members.organization, organizationId),
        eq(schema.users.email, raw.toLowerCase()),
      ),
    )
    .limit(1);
  return byEmail ? { userId: byEmail.userId, email: byEmail.email } : null;
}

export async function memberRoleSnapshot(
  organizationId: string,
  memberId: string,
): Promise<{ userId: string; email: string; role: string } | null> {
  const [row] = await db
    .select({
      userId: schema.members.user,
      email: schema.users.email,
      role: schema.members.role,
    })
    .from(schema.members)
    .innerJoin(schema.users, eq(schema.members.user, schema.users.id))
    .where(and(eq(schema.members.organization, organizationId), eq(schema.members.id, memberId)))
    .limit(1);
  return row
    ? { userId: row.userId, email: row.email, role: row.role }
    : null;
}
