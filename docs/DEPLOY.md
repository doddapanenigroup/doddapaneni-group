# Deploying Doddapaneni Group (Next.js)

## Before you deploy

1. **Turso (LibSQL)** — Create a database and token; set `DATABASE_URL=libsql://…` and `TURSO_AUTH_TOKEN` on the server (see `.env.example`). Schema tooling uses `prisma.config.ts` (LibSQL adapter); `schema.prisma` keeps a fixed `file:./dev.db` URL for Prisma 6 validation only.
2. **Schema** — On the server (or CI), from the project root:
   - `npx prisma db push` (with Turso env vars above). **Required before the first `npm run build`** if the build runs static generation that queries the DB (otherwise you see `no such table` during deploy).
   - To push schema to Turso from a machine where `.env` already has **`DATABASE_URL=libsql://…`** and **`TURSO_AUTH_TOKEN`**, run **`npm run db:push:turso`** (wrapper around `prisma db push`).
   - **Docker / DigitalOcean App Platform:** the repo `Dockerfile` runs `npx prisma db push` in the **builder** stage before `npm run build`; provide `DATABASE_URL` (libsql) and `TURSO_AUTH_TOKEN` as **build-time** secrets so the remote DB has tables before SSG.
   - **After the first `db push` on Turso**, load app data (otherwise news/team/careers/nav look empty and sectors show “Coming soon”): **`npm run db:turso:init`** (remote push + seed users/sectors/careers + team). For images in DB, temporarily set `DATABASE_URL` to your Turso URL and run `npm run media:seed`, or add a matching CI step.
   - **Login bounce (dashboard → login):** set `NEXTAUTH_URL` to the exact public origin you use in the browser (e.g. `https://www.example.com`, no trailing slash). Mismatch breaks the session cookie and `/api/auth/session` stays empty.
   - **`npm run media:seed`** — copies every image under `public/` into the `stored_image` table so `/api/media/...` works (required for logos, blog images, etc.).
   - Optional first data: `npm run db:seed` (set seed env vars first; see `.env.example`).
3. **Secrets** — Set `AUTH_SECRET` (32+ random bytes, e.g. `openssl rand -base64 32`).
4. **Public URL** — Set `NEXTAUTH_URL` (and optionally `AUTH_URL`) to the **HTTPS** URL users use, e.g. `https://your-domain.com`. Wrong values break login cookies and redirects.
5. **Email** — Set `EMAIL_USER`, `EMAIL_PASS`, and for Hostinger (or other SMTP) `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`. The contact form, invites, and similar mail use the same settings as in `lib/email.ts`.

Health check for monitors/load balancers: `GET /api/health`.

Nginx + TLS example: `docs/nginx-doddapaneni-group.conf`.

## Option A — VPS / Hostinger (Node on the host)

```bash
npm ci
export DATABASE_URL="libsql://your-db.turso.io"
export TURSO_AUTH_TOKEN="..."
export AUTH_SECRET="..."
export NEXTAUTH_URL="https://your-domain.com"
# plus email / SMTP variables
npx prisma db push
npm run media:seed
npm run build
npm run start
```

`npm run start` binds `0.0.0.0:3000` so a reverse proxy can reach the app.

**PM2** (optional):

```bash
pm2 start ecosystem.config.cjs
```

Use a process manager or systemd so the app restarts after reboot.

## Option B — Docker

Build (supply a real `AUTH_SECRET` at build time so `next build` can load auth config):

```bash
docker build --build-arg AUTH_SECRET="$(openssl rand -base64 32)" -t doddapaneni-group .
```

Run with production env (at minimum `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, and email variables):

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="libsql://your-db.turso.io" \
  -e TURSO_AUTH_TOKEN="..." \
  -e AUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e EMAIL_USER="..." \
  -e EMAIL_PASS="..." \
  -e SMTP_HOST="smtp.hostinger.com" \
  -e SMTP_PORT="587" \
  -e SMTP_SECURE="false" \
  doddapaneni-group
```

Put TLS on Nginx or your cloud load balancer in front of the container.

## Option C — Vercel (or similar)

Connect the Git repo, set the same environment variables in the project settings, and deploy. Use Turso (or another LibSQL host) for `DATABASE_URL` plus `TURSO_AUTH_TOKEN`. Vercel runs `npm run build` from `vercel.json`; `output: 'standalone'` in `next.config.ts` is normal and does not prevent Vercel from deploying.

## After deploy

- Open the site over **HTTPS** and test login (including email OTP).
- Confirm the **contact** form sends mail (uses the same SMTP configuration as OTP).
