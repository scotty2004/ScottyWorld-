# ScottyWorld Phase 10 — Full Integration Layer

Phase 10 connects the platform to real external services without hardcoding
a single vendor into the application.

## Integrated foundations

### Scotty AI
`POST /api/ai/chat`

Set:
- `AI_API_KEY`
- `AI_API_URL`
- `AI_MODEL`

The gateway uses an OpenAI-compatible chat-completions contract and can be
replaced with another adapter later.

### Bot runtime
`POST /api/bots/:id/runtime`

Set:
- `BOT_RUNTIME_ENDPOINT`
- `BOT_RUNTIME_SECRET`

Only the authenticated bot owner can invoke the runtime route.

### Scotty Cloud
`POST /api/cloud/upload-url`

Set:
- `STORAGE_ENDPOINT`
- `STORAGE_BUCKET`
- `STORAGE_ADAPTER_URL`

The app requests a presigned upload URL from the adapter. Files are never
accepted blindly by the browser-facing API.

### Payments
`POST /api/payments/webhook`

Set:
- `PAYMENT_WEBHOOK_SECRET`

Webhook signatures are verified and subscription state updates are constrained
to known enum values. Event IDs are checked for replay/idempotency.

### Email
`lib/integrations/email.ts`

Set:
- `EMAIL_API_URL`
- `EMAIL_API_KEY`

Use this adapter for verification, password reset and security notifications.

## Security
- External secrets stay server-side.
- AI, runtime, uploads and webhooks are rate-limited or signature-protected.
- API responses never return provider secrets.
- Integration status is admin-only.
- Existing RBAC and ownership checks remain authoritative.

## Remaining provider-specific work
The integration layer is deliberately vendor-neutral. Before production, choose
your actual AI, bot runtime, storage, email and payment providers and implement
their provider adapters/webhooks against these contracts.
