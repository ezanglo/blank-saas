# Runbook — Stripe

## Related env keys

See [`.env.example`](../../.env.example): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, price IDs for plans.

## Production webhook URL

Configure **Stripe Dashboard → Developers → Webhooks** to deliver events to:

`https://<your-production-host>/api/webhooks/stripe`

The handler validates signatures with `STRIPE_WEBHOOK_SECRET`.

## Local / staging parity

Forward Stripe CLI events to your dev server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use test keys (`sk_test_…`, `pk_test_…`) and the CLI signing secret in `.env.local`. Treat CLI secrets as disposable.

## Signing secret rotation

1. In Stripe Dashboard, create a **new** webhook signing secret (or add an endpoint and retire the old one after cutover).
2. Update `STRIPE_WEBHOOK_SECRET` in your deployment environment (Vercel env UI, Docker secrets, etc.).
3. Redeploy or restart so all instances pick up the new value.
4. Verify one synthetic event (CLI `stripe trigger` or Dashboard “Send test webhook”) returns **200** with no signature errors in logs.

During overlap you may briefly run two endpoints or dual secrets only if your handler explicitly supports it — this app expects **one** active secret per deployment.

## Idempotency / replay

Processed Stripe events are tracked via the **`stripe_processed_events`** Payload collection / table (unique `event_id`). Duplicate deliveries should short-circuit once recorded.

If you replay historical events after data fixes, confirm whether rows must be cleared or events safely no-op — prefer Stripe Dashboard replay only after understanding side effects on subscriptions and org billing state.

## Common incidents

| Symptom | Checks |
|---------|--------|
| `400` / signature mismatch | Wrong `STRIPE_WEBHOOK_SECRET`, body altered by proxy, or forwarding through a URL rewriter |
| Subscriptions not updating | Webhook disabled in Dashboard; handler throwing — check app logs / error monitoring |
| Customer Portal redirect fails | Allowed return URLs in Stripe Dashboard; CSP `form-action` / `frame-src` if enforcing CSP (see [`csp-matrix.md`](csp-matrix.md)) |
