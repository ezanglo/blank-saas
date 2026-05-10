import { and, eq } from "@payloadcms/db-postgres/drizzle";
import { precompute } from "flags/next";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { productFlags } from "@/lib/flags/flags";
import { FLAGS_PRECOMPUTE_COOKIE } from "@/lib/flags/resolver";
import { db } from "@/lib/db";
import { apiRateLimiter } from "@/lib/quota/limiter";
import {
  isProtectedProductPath,
  sessionActiveOrg,
} from "@/lib/proxy-guards";
import { workspaceHomePath } from "@/lib/org/workspace-home";
import * as schema from "@/payload-generated-schema";

function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function mergeResponseHeaders(res: NextResponse, extra: Headers | undefined) {
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const ip = clientIp(request);
    const { success, pending } = await apiRateLimiter.limit(ip);
    if (pending) await pending;
    if (!success) {
      return new NextResponse("Too many requests", { status: 429 });
    }
  }

  if (!isProtectedProductPath(pathname)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }

  let resolvedActiveId = sessionActiveOrg(session);
  let sessionCookieHeaders: Headers | undefined;

  if (!resolvedActiveId) {
    const [firstMember] = await db
      .select({ organizationId: schema.members.organization })
      .from(schema.members)
      .where(eq(schema.members.user, session.user.id))
      .limit(1);

    if (firstMember?.organizationId) {
      resolvedActiveId = firstMember.organizationId;
      const setResult = (await auth.api.setActiveOrganization({
        headers: request.headers,
        body: { organizationId: firstMember.organizationId },
        returnHeaders: true,
      })) as { headers?: Headers };

      if (setResult?.headers) {
        sessionCookieHeaders = setResult.headers;
      }
    }
  }

  const workspaceFallback = new URL(
    await workspaceHomePath({
      userId: session.user.id,
      organizationId: resolvedActiveId ?? null,
    }),
    request.url,
  );

  const orgSlug = pathname.match(/^\/organizations\/([^/]+)/)?.[1];
  if (orgSlug) {
    const slug = orgSlug;
    const [org] = await db
      .select({ id: schema.organizations.id })
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, slug))
      .limit(1);

    if (!org) {
      return NextResponse.redirect(workspaceFallback);
    }

    const [membership] = await db
      .select({ id: schema.members.id })
      .from(schema.members)
      .where(
        and(
          eq(schema.members.user, session.user.id),
          eq(schema.members.organization, org.id),
        ),
      )
      .limit(1);

    if (!membership) {
      return NextResponse.redirect(workspaceFallback);
    }

    if (resolvedActiveId && resolvedActiveId !== org.id) {
      return NextResponse.redirect(workspaceFallback);
    }
  }

  const res = NextResponse.next({ request: { headers: request.headers } });

  if (process.env.FLAGS_SECRET) {
    try {
      const code = await precompute(productFlags);
      res.cookies.set(FLAGS_PRECOMPUTE_COOKIE, code, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 300,
        secure: process.env.NODE_ENV === "production",
      });
    } catch {
      /* dev without DB / misconfigured flags — omit cookie */
    }
  }

  return mergeResponseHeaders(res, sessionCookieHeaders);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
