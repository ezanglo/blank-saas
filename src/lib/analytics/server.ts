import { PostHog } from "posthog-node";

let client: PostHog | null = null;

function posthogApiKey(): string | undefined {
  const k = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  return k || undefined;
}

function posthogHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://app.posthog.com";
}

function getClient(): PostHog | null {
  const key = posthogApiKey();
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, { host: posthogHost() });
  }
  return client;
}

export type CaptureServerEventInput = {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
  /** PostHog group type `company` → org id (PRD §30.6). */
  groups?: Record<string, string>;
};

/** Fire-and-forget capture; no-ops when `NEXT_PUBLIC_POSTHOG_KEY` is unset. */
export function captureServerEvent(input: CaptureServerEventInput): void {
  const c = getClient();
  if (!c) return;
  c.capture({
    distinctId: input.distinctId,
    event: input.event,
    properties: input.properties,
    groups: input.groups,
  });
}

/**
 * Flush and tear down the server client (tests + graceful shutdown).
 * Uses `PostHog._shutdown` (posthog-node public lifecycle API).
 */
export async function shutdownAnalytics(): Promise<void> {
  if (!client) return;
  const toClose = client;
  client = null;
  await toClose.flush();
  await (toClose as PostHog & { _shutdown: (ms?: number) => Promise<void> })._shutdown();
}
