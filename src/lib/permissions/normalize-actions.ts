/** Coerce Payload `actions` json to a string list for checks. */
export function normalizePermissionActions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}
