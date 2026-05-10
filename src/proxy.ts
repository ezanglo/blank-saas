import { and, eq } from "@payloadcms/db-postgres/drizzle";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiRateLimiter } from "@/lib/quota/limiter";
import * as schema from "@/payload-generated-schema";

function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isProtectedProductPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/organizations") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/settings")
  );
}

function sessionActiveOrg(session: {
  session: Record<string, unknown>;
}): string | null {
  const s = session.session as {
    activeOrganizationId?: string | null;
    activeOrganization?: string | null;
  };
  return s.activeOrganizationId ?? s.activeOrganization ?? null;
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

  const orgSeg = pathname.match(/^\/organizations\/([^/]+)/);
  if (orgSeg?.[1]) {
    const slug = orgSeg[1];
    const [org] = await db
      .select({ id: schema.organizations.id })
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, slug))
      .limit(1);

    if (!org) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
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
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (resolvedActiveId && resolvedActiveId !== org.id) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const res = NextResponse.next({ request: { headers: request.headers } });
  return mergeResponseHeaders(res, sessionCookieHeaders);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
