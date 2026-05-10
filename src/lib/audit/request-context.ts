type HeaderBag = { get(name: string): string | null | undefined };

export function clientIpFromHeaders(h: HeaderBag): string | null {
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? h.get("x-real-ip");
  return ip || null;
}

export function userAgentFromHeaders(h: HeaderBag): string | null {
  return h.get("user-agent") || null;
}
