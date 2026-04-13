# Production image (Node 20 + Next.js standalone). Prisma client is generated at build time (Linux engine).
# Build:  docker build --build-arg AUTH_SECRET="$(openssl rand -base64 32)" -t doddapaneni-group .
# Run:    docker run --rm -p 3000:3000 -e DATABASE_URL=... -e AUTH_SECRET=... -e NEXTAUTH_URL=https://your.domain \
#           -e EMAIL_USER=... -e EMAIL_PASS=... [-e SMTP_*] doddapaneni-group

# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# postinstall / prepare run `prisma generate` — schema must exist before `npm ci`
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
WORKDIR /app
ARG AUTH_SECRET=replace-with-openssl-rand-base64-32-at-build
ENV AUTH_SECRET=$AUTH_SECRET
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma engines: ensures node_modules/.prisma is present for runtimes that resolve it alongside lib/prisma-generated.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
