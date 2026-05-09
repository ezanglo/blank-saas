import { headers } from "next/headers";

import { auth } from "@/lib/auth";

/** Use from Payload collection `access` (Server Components / Route Handlers). */
export async function getSessionForAccess() {
  const h = await headers();
  const webHeaders = new Headers();
  h.forEach((value, key) => webHeaders.append(key, value));
  return auth.api.getSession({ headers: webHeaders });
}
