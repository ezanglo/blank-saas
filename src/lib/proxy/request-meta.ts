import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function mergeResponseHeaders(res: NextResponse, extra: Headers | undefined) {
  if (!extra) return res;
  extra.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      res.headers.append(key, value);
    } else {
      res.headers.set(key, value);
    }
  });
  return res;
}
