"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

import { useActiveOrganization, useOrgBilling } from "@/lib/query/hooks";

function posthogConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim());
}

/** Sync active org to PostHog group analytics (`company`, PRD §30.6). */
export function PostHogWorkspaceGroup() {
  const { organization, organizationId } = useActiveOrganization();
  const { data: billing } = useOrgBilling(organizationId ?? undefined);

  useEffect(() => {
    if (!posthogConfigured() || !organizationId || !organization) return;
    posthog.group("company", organizationId, {
      name: organization.name,
      plan: billing?.plan ?? "free",
    });
  }, [organizationId, organization, billing?.plan]);

  return null;
}
