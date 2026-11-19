import type {
  Breadcrumb,
  BreadcrumbHint,
  ErrorEvent,
  EventHint,
  init,
} from "@sentry/nextjs";

type SentryDataCollection = NonNullable<Parameters<typeof init>[0]["dataCollection"]>;

const IP_AND_PROXY_HEADERS = ["forwarded", "-ip", "remote-", "via", "-user"];

/**
 * Sentry v11 replaced `sendDefaultPii` with `dataCollection`, whose defaults collect cookies,
 * user info and every HTTP body (sign-in/reset-password POSTs carry passwords). This restores the
 * privacy posture we had on v10 (`sendDefaultPii` unset). Shared by client, server and edge init.
 */
export const sentryDataCollection: SentryDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: IP_AND_PROXY_HEADERS },
    response: { deny: IP_AND_PROXY_HEADERS },
  },
  httpBodies: [],
  // Query strings are also stripped from event URLs in `sentryBeforeSend`.
  urlQueryParams: false,
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  graphQL: { document: false, variables: false },
};

function stripUrlQuery(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.search = "";
    return u.toString();
  } catch {
    const q = url.indexOf("?");
    return q === -1 ? url : url.slice(0, q);
  }
}

function scrubRequestUrls(event: ErrorEvent): void {
  const req = event.request;
  if (!req) return;
  if (req.url) req.url = stripUrlQuery(req.url);
  if (req.query_string) req.query_string = undefined;
}

/** Drop webhook breadcrumbs — Stripe/Svix payloads may contain secrets. */
export function sentryBeforeBreadcrumb(
  breadcrumb: Breadcrumb,
  hint?: BreadcrumbHint,
): Breadcrumb | null {
  const url =
    typeof breadcrumb.data?.url === "string"
      ? breadcrumb.data.url
      : typeof hint?.xhr?.url === "string"
        ? hint.xhr.url
        : undefined;
  if (url?.includes("/api/webhooks/")) {
    return null;
  }
  return breadcrumb;
}

export function sentryBeforeSend(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  void hint;
  scrubRequestUrls(event);
  const req = event.request;
  if (req?.headers) {
    delete req.headers.cookie;
    delete req.headers.authorization;
  }
  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
  }
  return event;
}

export function sentryEnvironment(): string {
  return (
    process.env.SENTRY_ENVIRONMENT ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development"
  );
}

export function sentryRelease(): string | undefined {
  return (
    process.env.SENTRY_RELEASE ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GIT_COMMIT_SHA
  );
}
