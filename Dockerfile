# syntax=docker/dockerfile:1
# Multi-stage build for the Next.js app. Versions are pinned: a floating tag
# turns a reproducible image into a lottery.
FROM node:24.12.0-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24.12.0-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma 7 generates a TS client into src/generated, so this must run before build.
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Migrations + seeding need the full source: prisma/seed.ts imports src/lib.
# Kept separate so the runtime image ships no source and no migration rights.
FROM node:24.12.0-alpine AS migrator
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

FROM node:24.12.0-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl && \
    addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
# Seeds the shared ml-artifacts volume on first start, so /admin/insights shows
# real model metrics before the ml batch job has ever run.
COPY --from=builder /app/ml/artifacts ./ml/artifacts

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]
