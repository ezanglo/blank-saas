import { WebhookEvents } from "@/lib/webhooks/events";

export const WEBHOOK_EVENT_OPTIONS = Object.keys(WebhookEvents) as (keyof typeof WebhookEvents)[];
