import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import {
  sentryBeforeBreadcrumb,
  sentryBeforeSend,
  sentryDataCollection,
} from "./options";

describe("sentryBeforeSend", () => {
  it("strips query strings from request URLs and removes cookies from headers", () => {
    const event: ErrorEvent = {
      type: undefined,
      request: {
        url: "https://example.com/path?token=secret",
        headers: { cookie: "sid=abc", "accept-language": "en" },
      },
      user: {
        id: "u1",
        email: "user@example.com",
        username: "u",
        ip_address: "1.2.3.4",
      },
    };

    const out = sentryBeforeSend(event, {});

    expect(out?.request?.url).toBe("https://example.com/path");
    expect(out?.request?.headers?.cookie).toBeUndefined();
    expect(out?.request?.headers?.["accept-language"]).toBe("en");
    expect(out?.user?.email).toBeUndefined();
    expect(out?.user?.username).toBeUndefined();
    expect(out?.user?.ip_address).toBeUndefined();
  });
});

describe("sentryBeforeBreadcrumb", () => {
  it("drops breadcrumbs for webhook URLs", () => {
    const bc: Breadcrumb = { category: "xhr", message: "post" };
    const rich: Breadcrumb = {
      ...bc,
      data: { url: "https://app.test/api/webhooks/stripe" },
    };
    expect(sentryBeforeBreadcrumb(rich, {})).toBeNull();
    expect(
      sentryBeforeBreadcrumb(
        { ...bc, data: { url: "https://app.test/api/ok" } },
        {},
      ),
    ).toEqual(expect.objectContaining({ category: "xhr" }));
  });
});

describe("sentryDataCollection", () => {
  // Sentry v11 collects bodies, cookies and user info unless told otherwise.
  it("opts out of PII-bearing collection by default", () => {
    expect(sentryDataCollection).toMatchObject({
      userInfo: false,
      cookies: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
    });
  });
});
