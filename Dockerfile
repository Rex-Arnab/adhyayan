# syntax=docker/dockerfile:1
# Versions are pinned: a floating tag turns a reproducible image into a lottery.
#
# Dependencies are installed in the SAME stage that uses them. An extra `deps`
# stage whose node_modules is copied forward saves nothing here and fails on some
# Docker Desktop builds with:
#   failed to compute cache key: "/app/node_modules": not found
FROM node:24.12.0-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json ./
# `npm install` rather than `npm ci`: it tolerates a lockfile that has drifted
# slightly from package.json instead of aborting the whole build.
RUN npm install --no-audit --no-fund

COPY . .
# Prisma 7 generates a TypeScript client into src/generated, so this must run
# before the Next build compiles anything that imports it.
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Migrations and seeding need the full source: prisma/seed.ts imports src/lib.
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
