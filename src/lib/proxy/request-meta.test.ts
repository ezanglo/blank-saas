import { describe, expect, it } from "vitest";
import { NextRequest, NextResponse } from "next/server";

import { clientIp, mergeResponseHeaders } from "@/lib/proxy/request-meta";

describe("clientIp", () => {
  it("prefers x-forwarded-for first hop", () => {
    const req = new NextRequest("http://localhost/", {
      headers: {
        "x-forwarded-for": "203.0.113.1, 10.0.0.1",
      },
    });
    expect(clientIp(req)).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip then unknown", () => {
    const req = new NextRequest("http://localhost/", {
      headers: { "x-real-ip": "198.51.100.2" },
    });
    expect(clientIp(req)).toBe("198.51.100.2");

    expect(clientIp(new NextRequest("http://localhost/"))).toBe("unknown");
  });
});

describe("mergeResponseHeaders", () => {
  it("copies non-cookie headers onto the response", () => {
    const res = NextResponse.json({ ok: true });
    const extra = new Headers();
    extra.set("x-test", "1");
    mergeResponseHeaders(res, extra);
    expect(res.headers.get("x-test")).toBe("1");
  });

  it("returns response unchanged when extra missing", () => {
    const res = NextResponse.json({ ok: true });
    expect(mergeResponseHeaders(res, undefined)).toBe(res);
  });
});
