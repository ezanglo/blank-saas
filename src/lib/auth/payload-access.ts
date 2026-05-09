import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";

/** Use from Payload collection `access` (Server Components / Route Handlers). */
export async function getSessionForAccess() {
  const h = await headers();
  return auth.api.getSession({ headers: headersToWebRequestHeaders(h) });
}
