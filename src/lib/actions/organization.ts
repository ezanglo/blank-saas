"use server";

import { headers } from "next/headers";
import slugify from "slugify";

import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import {
  ForbiddenError,
  getMemberRole,
  requireOrgRole,
} from "@/lib/auth/require-org";
import { canDeleteOrganization, canUpdateOrganization } from "@/lib/auth/rbac";

/** Create org via Better Auth (same row as Payload `organizations`). */
export async function createOrganizationAction(input: {
  name: string;
  slug?: string;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  const slug =
    (input.slug ?? slugify(name, { lower: true, strict: true })).trim() || "org";

  const h = await headers();
  return auth.api.createOrganization({
    body: { name, slug },
    headers: headersToWebRequestHeaders(h),
  });
}

/** Update org name/slug (admin+). */
export async function updateOrganizationAction(input: {
  organizationId: string;
  name?: string;
  slug?: string;
}) {
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  const role = await getMemberRole(input.organizationId, session.user.id);
  if (!canUpdateOrganization(role)) throw new ForbiddenError();

  const data: { name?: string; slug?: string } = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.slug !== undefined) data.slug = input.slug.trim();

  if (Object.keys(data).length === 0) {
    throw new Error("No fields to update");
  }

  return auth.api.updateOrganization({
    body: {
      organizationId: input.organizationId,
      data,
    },
    headers: webHeaders,
  });
}

/** Delete org via Better Auth (owner only with default AC). */
export async function deleteOrganizationAction(organizationId: string) {
  if (!organizationId) throw new Error("organizationId required");
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  const role = await getMemberRole(organizationId, session.user.id);
  if (!canDeleteOrganization(role)) throw new ForbiddenError();

  return auth.api.deleteOrganization({
    body: { organizationId },
    headers: webHeaders,
  });
}

export async function setActiveOrganizationAction(input: {
  organizationId: string;
}) {
  if (!input.organizationId) throw new Error("organizationId required");
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");
  await requireOrgRole({
    organizationId: input.organizationId,
    userId: session.user.id,
    min: "member",
  });
  return auth.api.setActiveOrganization({
    body: { organizationId: input.organizationId },
    headers: webHeaders,
  });
}
