# ScottyWorld Phase 9 — Production Hardening

## Included
- Next.js standalone production output
- Docker multi-stage build
- Docker Compose development stack
- Production environment template
- Security headers
- HTTPS HSTS in production
- Basic unauthenticated protected-route redirect
- PWA manifest and service worker
- Global loading/error/404 states
- Database health endpoint at `/api/health`
- Rate-limit foundation
- Optimized imports for major UI packages

## Deployment checklist

1. Use PostgreSQL with TLS.
2. Set a long random `SESSION_SECRET`.
3. Set `NEXT_PUBLIC_APP_URL` to the real HTTPS domain.
4. Configure payment webhooks before treating subscriptions as paid.
5. Configure object storage before accepting real uploads.
6. Run:
   ```bash
   npm ci
   npx prisma generate
   npx prisma migrate deploy
   npm run build
   npm start
   ```
7. Confirm:
   ```text
   GET /api/health
   ```
8. Test registration, login, logout, password recovery, role protection,
   bot permissions, marketplace permissions, coin adjustments and audit logs.
9. Put the application behind HTTPS and a reverse proxy/CDN.
10. Use a shared Redis/database-backed rate limiter for multi-instance production.
11. Configure automated PostgreSQL backups and test restoration.
12. Keep `.env`, credentials, API keys and payment secrets out of Git.
13. Monitor application errors, database health, authentication failures and
    security events.

## Important
The service worker is intentionally small and only caches the public shell.
Authenticated API responses are not cached by the service worker.

The in-memory rate limiter is a foundation, not a complete distributed
production limiter.
