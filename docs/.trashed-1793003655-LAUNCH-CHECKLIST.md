# ScottyWorld Launch Checklist

## Infrastructure
- [ ] Production PostgreSQL provisioned
- [ ] Automated database backups enabled
- [ ] Restore tested in staging
- [ ] HTTPS enabled
- [ ] Domain configured
- [ ] CDN/reverse proxy configured
- [ ] Resource limits and alerts configured

## Application
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] Prisma client generated
- [ ] Production migrations applied
- [ ] `/api/health` returns healthy
- [ ] `/api/ready` returns ready
- [ ] No development secrets are committed

## Security
- [ ] Strong production secrets configured
- [ ] Secure cookies verified
- [ ] RBAC tested
- [ ] Admin access tested
- [ ] Rate limits tested
- [ ] File upload validation tested
- [ ] Security headers verified
- [ ] Audit logs verified
- [ ] Security contact published

## Integrations
- [ ] AI adapter configured
- [ ] Bot runtime configured
- [ ] Storage adapter configured
- [ ] Email provider configured
- [ ] Payment provider configured
- [ ] Webhook signature verified
- [ ] Duplicate webhook behavior tested

## Product
- [ ] Mobile navigation tested
- [ ] Desktop layout tested
- [ ] Dark/light themes tested
- [ ] Empty/loading/error states checked
- [ ] Forms validated
- [ ] Notifications tested
- [ ] Search tested
- [ ] Marketplace flow tested
- [ ] Academy progress tested
- [ ] Community moderation tested

## SEO/PWA
- [ ] `robots.txt`
- [ ] `sitemap.xml`
- [ ] canonical URLs
- [ ] Open Graph metadata
- [ ] manifest
- [ ] service worker
- [ ] favicon/logo assets
- [ ] page titles/descriptions

## Final release
- [ ] Staging smoke test complete
- [ ] Security review complete
- [ ] Performance check complete
- [ ] Accessibility check complete
- [ ] Monitoring active
- [ ] Rollback plan documented
- [ ] Production release approved
