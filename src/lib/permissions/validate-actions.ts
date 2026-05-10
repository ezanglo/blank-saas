import { resourceActionsFor } from "@/lib/permissions/types";

const CUSTOM_ACTION_RE = /^[a-z][a-z0-9_]*$/;

export function validateGrantActions(resourceType: string, actions: string[]): void {
  if (!actions.length) {
    throw new Error("Select at least one action.");
  }
  const allowed = resourceActionsFor(resourceType);
  if (allowed) {
    for (const a of actions) {
      if (!(allowed as readonly string[]).includes(a)) {
        throw new Error(`Action "${a}" is not valid for resource type "${resourceType}".`);
      }
    }
    return;
  }
  for (const a of actions) {
    if (!CUSTOM_ACTION_RE.test(a)) {
      throw new Error(
        `Invalid action "${a}". Use lowercase snake_case names for custom resource types.`,
      );
    }
  }
}
