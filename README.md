# ScottyWorld — Phase 7: Cloud + Security Center + Pro

Phase 7 adds foundations for private cloud metadata, account security visibility and configurable Pro subscriptions.

## Scotty Cloud
- Private file/project metadata
- Folders
- Visibility
- File size/type/checksum metadata
- Ownership enforcement
- Delete/update controls
- Storage-provider-ready architecture

This phase does not fake file storage. Connect S3-compatible/object storage or another provider in the storage integration layer.

## Security Center
- Active session listing
- Session revocation
- Security event ledger
- Hashed IP identifiers
- User-agent tracking
- 2FA foundation visibility

Secrets and raw IP addresses are not exposed through the UI.

## Pro
- Configurable Pro plans
- Monthly/yearly intervals
- Provider-agnostic subscription records
- Feature/limit JSON configuration
- Subscription intent endpoint

The subscription endpoint deliberately does not mark a payment as successful. A real payment provider webhook must confirm payment before activation.

## Migration

```bash
npm install
npx prisma generate
npx prisma migrate dev --name phase7-cloud-security-pro
npm run dev
```


## Phase 8 — Control Center
Adds a separate RBAC-protected `/admin` Control Center with server-side role checks, admin dashboard, users, bots, marketplace moderation, community reports, academy overview, news/channels foundations, Scotty Coins adjustments, subscription overview, security events, audit logs, and platform settings.

### Admin roles
- SUPER_ADMIN
- ADMIN
- MODERATOR
- SUPPORT
- CONTENT_MANAGER
- FINANCE_MANAGER

Privileged mutations are audited. The admin URL itself never grants access.

### Database
After extracting/updating dependencies, run:
```bash
npx prisma generate
npx prisma migrate dev --name phase8_control_center
```
For production, use your normal migration deployment workflow.

### Important production notes
- Configure a real PostgreSQL database.
- Keep all secrets in environment variables.
- Add production payment-provider webhooks before treating subscriptions as paid.
- Connect real object storage before treating Cloud metadata as uploaded files.
- Add dedicated news/channel models and richer moderation actions in later iterations.


## Phase 9 — Production Hardening
Adds standalone Next.js production output, Docker deployment files, production
environment template, security headers, protected-route navigation checks, PWA
manifest/service worker, global loading/error/404 states, database health check,
rate-limit foundation and a production deployment checklist.

See `docs/PHASE9-PRODUCTION.md`.

### Production commands
```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```


## Phase 10 — Full Integration
Adds provider-agnostic Scotty AI, bot-runtime gateway, secure cloud upload
presigning, signed payment webhooks, email adapter, integration status checks,
request rate limiting and integration documentation.

See `docs/PHASE10-INTEGRATIONS.md`.

## Phase 11 — Launch & Final Polish
See `docs/PHASE11-LAUNCH.md` and `docs/LAUNCH-CHECKLIST.md` for production launch, SEO, observability, readiness, backup and final QA guidance.

## Phase 12 — Complete Product Surface

Phase 12 closes the remaining product-surface gaps from the original ScottyWorld specification:
global search, preferences, notification preferences, projects, support tickets, FAQ, news/channels foundations, favorites, permitted downloader job flow, additional user/product data models, and completion documentation.

External services remain provider-configurable and must be configured/tested before production launch.
