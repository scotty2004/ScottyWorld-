# Phase 15 — uploads, sign-up, Google, admin

## Uploads (Scotty Cloud + post videos/photos)
- `POST /api/cloud/upload-url` always works for a signed-in user. With an S3/R2 bucket it returns a presigned URL
  (direct upload) plus a server fallback URL; without a bucket it returns the server URL.
- `PUT /api/upload?key=…` receives the raw file and stores it in the bucket (if connected) or in the database
  (`StoredFile` / `StoredChunk`, 4 MB chunks). The browser retries through it automatically if a direct upload fails.
- `GET /api/files/<userId>/<file>` serves files with Range support (video seeking). Scotty Cloud files stay private to
  their owner; post media is readable by signed-in users. Only images/video/audio/PDF display inline.
- R2 fix: the AWS SDK adds CRC32 checksum params to presigned URLs, which R2 rejects. The client now uses
  `requestChecksumCalculation: "WHEN_REQUIRED"`. `S3_ENDPOINT` must be the account origin only
  (`https://<account>.r2.cloudflarestorage.com`, no bucket name) — a trailing path is now stripped automatically.
- `S3_PUBLIC_BASE_URL` is no longer needed; media is served through `/api/files`.
- Direct uploads to R2 still need a CORS rule on the bucket (AllowedOrigins = your site, AllowedMethods = PUT,
  AllowedHeaders = Content-Type). If it is missing, uploads simply fall back to the server route.

## Sign-up
Full name (name + surname), username, email, password with live strength meter, confirm password, date of birth
(13+). Rules are enforced on the server as well (`lib/validators/auth.ts`, `lib/auth/password-strength.ts`).
`User.dateOfBirth` is a new nullable column.

## Google sign-in
Buttons now use Google's redirect mode (`ux_mode: "redirect"`) → `POST /api/auth/google/callback`, instead of a popup.
In Google Cloud Console → Credentials → your OAuth client, add:
- Authorized JavaScript origins: `https://YOUR-DOMAIN`
- Authorized redirect URIs: `https://YOUR-DOMAIN/api/auth/google/callback`

## Admin
Only `maposacourage41@gmail.com` (hardcoded in `lib/admin/owner.ts`, email must be verified) can open `/admin` or call
any `/api/admin/*` route. The entry point is Settings → Admin, visible to that account only.

## Deploy
`npx prisma db push` (the Docker image already does this on start) to add the new column and tables.
