"use server";

import { headers } from "next/headers";
import slugify from "slugify";

import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";

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

/** Delete org via Better Auth (requires org delete permission, usually owner). */
export async function deleteOrganizationAction(organizationId: string) {
  if (!organizationId) throw new Error("organizationId required");
  const h = await headers();
  return auth.api.deleteOrganization({
    body: { organizationId },
    headers: headersToWebRequestHeaders(h),
  });
}
