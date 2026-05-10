import { AuditEvents } from "@/lib/audit/events";

export const AUDIT_ACTION_OPTIONS = Object.keys(AuditEvents) as (keyof typeof AuditEvents)[];
