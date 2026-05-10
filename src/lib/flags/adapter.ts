import config from "@payload-config";
import { flag } from "flags/next";
import { headers } from "next/headers";
import { getPayload } from "payload";

import { FEATURE_FLAG_EVALUATED } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/server";
import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { activeOrganizationIdFromSession } from "@/lib/org/session-active-org";

type FlagEntities = {
  org?: { id: string };
  user?: { id: string };
};

function currentDeploymentMatches(recordEnv: string): boolean {
  if (recordEnv === "all") return true;
  const vercel = process.env.VERCEL_ENV;
  if (vercel === "production") return recordEnv === "production";
  if (vercel === "preview") return recordEnv === "staging" || recordEnv === "development";
  if (vercel === "development") return recordEnv === "development";
  if (process.env.NODE_ENV === "production") return recordEnv === "production";
  return recordEnv === "development";
}

async function identifySessionEntities(): Promise<FlagEntities> {
  const h = await headers();
  const session = await auth.api.getSession({ headers: headersToWebRequestHeaders(h) });
  if (!session?.user?.id) return {};
  const orgId = activeOrganizationIdFromSession(session);
  return {
    user: { id: session.user.id },
    org: orgId ? { id: orgId } : undefined,
  };
}

/** Postgres-backed flag via Payload `feature-flags` collection (PRD §15). */
export function createPayloadBackedFlag(flagKey: string) {
  return flag<boolean>({
    key: flagKey,
    defaultValue: false,
    identify: identifySessionEntities,
    async decide({ entities }) {
      const payload = await getPayload({ config });
      const result = await payload.find({
        collection: "feature-flags",
        where: { key: { equals: flagKey } },
        limit: 1,
        overrideAccess: true,
      });
      const record = result.docs[0] as
        | {
            enabled?: boolean | null;
            rolloutPercentage?: number | null;
            allowlist?: unknown;
            environments?: string | null;
          }
        | undefined;

      const orgId = entities?.org?.id;
      const userId = entities?.user?.id;

      let decided = false;

      if (!record || !record.enabled) {
        decided = false;
      } else {
        const env = record.environments ?? "all";
        if (!currentDeploymentMatches(env)) {
          decided = false;
        } else {
          const allowlist = record.allowlist as string[] | null | undefined;
          const allowlisted =
            Array.isArray(allowlist) &&
            ((orgId != null && allowlist.includes(orgId)) ||
              (userId != null && allowlist.includes(userId)));

          if (allowlisted) {
            decided = true;
          } else {
            const pct = record.rolloutPercentage ?? 0;
            if (pct >= 100) decided = true;
            else if (pct <= 0) decided = false;
            else {
              const hash = orgId
                ? [...orgId].reduce((a, c) => a + c.charCodeAt(0), 0)
                : userId
                  ? [...userId].reduce((a, c) => a + c.charCodeAt(0), 0)
                  : 0;
              decided = hash % 100 < pct;
            }
          }
        }
      }

      const distinctId = userId ?? orgId;
      if (distinctId) {
        captureServerEvent({
          distinctId,
          event: FEATURE_FLAG_EVALUATED,
          properties: { flagKey, result: decided, orgId: orgId ?? undefined },
          groups: orgId ? { company: orgId } : undefined,
        });
      }

      return decided;
    },
  });
}
