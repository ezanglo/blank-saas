import type {
  Breadcrumb,
  BreadcrumbHint,
  ErrorEvent,
  EventHint,
} from "@sentry/core";

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
