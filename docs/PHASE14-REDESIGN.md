# Phase 14 — Full redesign + real features

## Apply it
```bash
npm install                 # adds tsx (seed runner)
npx prisma generate
npx prisma db push          # new tables/columns (all additive)
npm run db:seed             # optional: Pro plans, official channels, FAQ, starter coin tasks
npm run dev
```
Set in `.env`: `OPENROUTER_API_KEY` (Scotty AI + screenshot checking), `S3_*` (Scotty Cloud, post videos),
`SMTP_*` (verification / password-reset emails). Set your S3/R2 bucket CORS to allow `PUT` from your site.

## Economy (edit `lib/economy.ts`)
| Rule | Value |
|---|---|
| 20 coins | $0.50  (40 coins = $1) |
| Referral (verified sign-up) | 6 SC |
| Referral link click | 2 SC (1 per visitor / 24h, max 10 per referrer / day) |
| Marketplace platform fee | 5% (credited to the first SUPER_ADMIN account) |
| Bot hosting | 7 days free, renew 20 SC / 7 days |
| Bot-file generator | free for the first 4 days of an account (and Gold/Platinum), else 10 SC |

Pro plans (`lib/pro/plans.ts`): Silver $1 · Bronze $2 · Gold $3 · Platinum $4 — bought with coins (30 days).

## What changed
* New design system (mockup blue/white, dark mode), phone bottom-nav + desktop sidebar (`components/app-shell.tsx`).
* Landing page copies the dark website mock, with **live** numbers from the database.
* Scotty AI: full-screen streaming chat, answers as "Scotty AI" (server-side persona), plan quotas, history on device.
* Wallet: mastercard-style card with 6-digit account number, send/receive, deposit requests, earn tasks with screenshot proof
  (duplicate-image + AI screening, admin approves), referral links.
* Bots: hosting timer + weekly renewal, AI bot-file generator, download, sell on marketplace.
* Marketplace: anyone can sell (file upload or link), 5% fee, gated downloads, seller/buyer pages.
* Community: Reddit-style feed, stories (24h), photo/video posts, threaded replies, repost/share, live updates (SSE).
* Messages (DMs with read receipts / online status), Notifications, Profile, Search (recent + trending), Channels.
* Academy: AI-generated courses (Admin → Academy → Generate), per-lesson progress, quizzes.
* Analytics: weekly top-10 with badges + "coming soon". Cloud: upload/download with quotas. Pro, Support, FAQ.
* Settings: Account, Privacy & Security (private account, blocked users, real TOTP 2FA), Notifications, Appearance,
  Messages, About, Security Center (sessions).
* Admin: task-review queue with AI verdict, deposit confirmation, news posting, channels, bots (status + hosting days), coins.

## Bugs fixed along the way
* `/api/coins` was a copy of the admin route (403 for normal users) — wallet never loaded.
* Referrals were never attributed; password-reset link pointed to a page that didn't exist.
* Chat sent no system prompt (so it never answered "as Scotty AI"); lesson progress could never pass 1 lesson.
* Marketplace purchases never paid the seller; product API leaked paid download links; search leaked other users' bots.
* Cloud: a user could register another user's storage key. Login had no rate limit. Service worker cached signed-in pages.

## Things that need your decision / hosting
* **Bots really running** — the platform tracks hosting time and status, but the process that runs each bot must live on
  your server. Use *Admin → Bots* to set RUNNING/STOPPED and grant days; lapsed bots auto-pause on next list.
* **Real-money deposits** — with no `PAYMENT_PROVIDER`, a deposit is a *request* the admin confirms (Admin → Deposits).
  With a provider, send a `deposit.completed` webhook event with `depositId`.
* Terms / Privacy / Guidelines in `lib/legal.ts` are drafts — get them reviewed.
