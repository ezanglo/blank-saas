import { getPrecomputed } from "flags/next";
import { cookies } from "next/headers";

import { productFlags, webhooksEnabledFlag } from "@/lib/flags/flags";

/** HttpOnly cookie set in `src/proxy.ts` when `FLAGS_SECRET` is present. */
export const FLAGS_PRECOMPUTE_COOKIE = "flags_precompute";

/** Prefer precomputed values from the proxy to avoid duplicate Payload reads per request. */
export async function resolveWebhooksEnabledFlag(): Promise<boolean> {
  const secret = process.env.FLAGS_SECRET;
  if (secret) {
    try {
      const jar = await cookies();
      const code = jar.get(FLAGS_PRECOMPUTE_COOKIE)?.value;
      if (code) {
        const v = await getPrecomputed(webhooksEnabledFlag, productFlags, code, secret);
        if (typeof v === "boolean") return v;
      }
    } catch {
      /* cookie missing, invalid, or stale — evaluate normally */
    }
  }
  return webhooksEnabledFlag();
}
