# Capacity Connect Lite

Text-first learning platform. One thesis: instrument the student journey thoroughly enough that a
model picks the learner's next lesson better than the learner does.

Build plan: `~/.claude/plans/capacity-connect-lite-generic-noodle.md`. Progress: `TODO.md`.

## Stack invariants — do not "upgrade" these

- **Next 15.5.25**, App Router, TS strict. Not 16 — Next 16 renames `middleware.ts` → `proxy.ts`,
  which is where Auth.js route protection lives.
- **Prisma 7.10.0**. `npm i prisma@latest` installs an **8.0.0 release candidate** — never do that.
  - Driver adapters are **mandatory**: build the client via `new PrismaClient({ adapter: new PrismaPg(...) })`.
  - The connection URL lives in `prisma.config.ts`, **not** in `schema.prisma` (`url` there is a hard error).
  - Import `PrismaClient` from `@/generated/prisma/client` — **never** from `@prisma/client`.
  - Seed config is `prisma.config.ts` → `migrations.seed`. `migrate dev` does **not** auto-seed;
    run `npx prisma db seed` explicitly.
- **Auth.js v5 beta**, Credentials + JWT. JWT strategy is *required* with Credentials, not a preference.
  Env var is `AUTH_SECRET` (not `NEXTAUTH_SECRET`). No `@auth/prisma-adapter` — we own the `User` table.
- **Tailwind v4**: there is no `tailwind.config.ts`. Brand tokens are CSS vars in `src/app/globals.css`
  exposed through `@theme inline`; dark mode is `@custom-variant dark` + `next-themes attribute="class"`.
- **shadcn `base-nova`** is built on Base UI, not Radix. `Button` has **no `asChild`** — for links,
  apply `buttonVariants({...})` to the `<Link>` directly.
- **`@react-pdf/renderer`** must stay in `serverExternalPackages` (next.config.ts) or the certificate
  route crashes. Its route needs `export const runtime = "nodejs"` and `renderToBuffer`.

## Non-negotiable behaviour

- **Heartbeat clamp**: `Math.min(deltaSeconds, 20)` server-side. Never trust a client duration.
- **Exit tracking**: `pagehide` + `navigator.sendBeacon`. Not `beforeunload`, not `fetch`.
- `unsent` seconds clear **only after the POST resolves**.
- Enrolment creates `Enrollment` + all `ChapterProgress` rows in **one transaction**.
- Course completion flips status **and** issues the certificate in the **same transaction**.
- `passwordHash` never leaves a query.

## Local commands

```bash
npm run dev                  # http://localhost:3000
npx prisma migrate dev       # migrate
npx prisma db seed           # seed (explicit — not automatic)
npx prisma studio            # inspect
npx tsc --noEmit && npm run build
/opt/homebrew/opt/postgresql@17/bin/psql -d capacity_connect   # psql 17 (client 16 is too old)
```

## Anti-scope-creep

No video, live classes, forums, comments, notifications, email, payments, graded quizzes,
multi-tenancy, SCORM/xAPI, i18n, public API, instructor persona. **No LLM layer** — the recommender
is scikit-learn (see M8–M10). If it is not on the one-journey list, it does not exist.
