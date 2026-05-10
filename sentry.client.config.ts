import * as Sentry from "@sentry/nextjs";
import {
  sentryBeforeBreadcrumb,
  sentryBeforeSend,
  sentryEnvironment,
  sentryRelease,
} from "./src/lib/sentry/options";

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ||
  process.env.SENTRY_DSN?.trim();

if (dsn) {
  Sentry.init({
    dsn,
    enabled: process.env.SENTRY_ENABLED !== "false",
    environment: sentryEnvironment(),
    release: sentryRelease(),
    tracesSampleRate:
      process.env.NODE_ENV === "production"
        ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1")
        : 1,
    beforeSend: sentryBeforeSend,
    beforeBreadcrumb: sentryBeforeBreadcrumb,
  });
}
