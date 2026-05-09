# Handoff Notes — OmniRead Cleanup & UI/UX Pro Max Overhaul

This file is updated continuously during work. If you're picking this up, read this top-to-bottom first.

## Branch

All changes are on `claude/setup-gsd-project-Eg7B3`. Do **not** push directly to `main`. When the work is complete, open a PR into `main`.

```bash
git fetch origin
git checkout claude/setup-gsd-project-Eg7B3
git pull origin claude/setup-gsd-project-Eg7B3
cd web && npm install
```

## Plan reference

Full plan: `/root/.claude/plans/c-users-skx-gemini-antigravity-scratch-m-majestic-pearl.md` (assistant-side, not in repo). The phase list below is the canonical to-do.

## Phase status

| Phase | Status | Notes |
| --- | --- | --- |
| 0. Repo hygiene | ✅ Done | Deleted ~40 log/test/cleanup scripts under `web/`, consolidated `seeder/` + `seeder_v2/` → single `seeder/`, removed committed `.env`s, wrote root `.gitignore`, root `README.md`, `CONTRIBUTING.md`, `web/.env.example`. |
| 1. Critical bugs | ✅ Done | Deleted dead stubs `web/src/components/Reader.tsx` + `web/src/components/CommentsSection.tsx`. Fixed sync `params` typing in `web/src/app/u/[username]/page.tsx`. Excluded `scripts/` from app `tsconfig.json` to fix duplicate-`main` errors. `npx tsc --noEmit` clean. |
| 2. NextAuth wiring | 🔧 In progress | See below. |
| 3a. Design tokens / Layout / ThemeProvider | ⏳ Pending | |
| 3b. Navbar redesign | ⏳ Pending | |
| 3c. Homepage + ComicCard | ⏳ Pending | |
| 3d. Search tri-state filter | ⏳ Pending | |
| 3e. Reader polish + e-ink + smart split + prefetch | ⏳ Pending | |
| 3f. Community threading + spoiler curtain | ⏳ Pending | |
| 3g. Library tabs + states | ⏳ Pending | |
| 4. PRD feature gaps (danmu, Mihon import, streaks, wait-to-read) | ⏳ Pending | |
| 5. Verification + CI | ⏳ Pending | |

## Where to pick up

**Currently working on Phase 2 — NextAuth.** Sub-tasks:
1. Add NextAuth tables to `web/prisma/schema.prisma` (`Account`, `Session`, `VerificationToken`, plus `name`, `emailVerified`, `passwordHash` fields on `User`; relax `username`/`email` uniqueness behavior for OAuth flows).
2. `npx prisma migrate dev --name add_nextauth_tables`.
3. Create `web/src/lib/auth.ts` exporting `authOptions` (Discord + Google + Credentials providers, PrismaAdapter, JWT strategy).
4. Create `web/src/app/api/auth/[...nextauth]/route.ts` (re-exports `NextAuth(authOptions)`).
5. Create `web/src/lib/session.ts` exporting `getCurrentUserId(): Promise<string | null>` (server-side; reads session from `getServerSession(authOptions)`). For dev convenience also export `getCurrentUserIdOrDemo()` that returns `process.env.DEV_DEMO_USER_ID ?? null` when not signed in.
6. Replace **all 37** call sites of `'demo_user_id'` with `getCurrentUserId()` for API routes (return 401 if null) and `getCurrentUserIdOrDemo()` for RSC pages so the dev experience still works without OAuth keys.
   Inventory of sites was captured during planning — re-run `grep -rn "demo_user_id" web/src/` to enumerate.
7. Wrap `<RootLayout>` with `<SessionProvider>` (client component) and add a real account menu in `Navbar.tsx`.
8. Add `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, OAuth env vars to `web/.env.example` (already done).

## Local dev quickstart (for the coworker)

```bash
docker compose up -d postgres
cd web
cp .env.example .env.local         # generate NEXTAUTH_SECRET with `openssl rand -base64 32`
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

## Commands you'll use a lot

```bash
cd web
npx prisma generate                    # after schema changes
npx prisma migrate dev --name <change> # new migration
npx tsc --noEmit                       # type check (must be clean before push)
npm run lint
npm run build
```

## Conventions

- Server components by default; `'use client'` only when needed.
- Use design tokens from `web/src/app/globals.css` (`bg-background`, `text-foreground`, `bg-card`, etc.) — do **not** hardcode `bg-gray-900`/hex.
- shadcn primitives go in `web/src/components/ui/` via `npx shadcn@latest add <name>`.
- Lucide icons, never emoji, for UI chrome.
- Prisma migrations are committed; never edit one after merge.

## Known gotchas

- Next.js 16 requires `params` to be `Promise<{...}>` and `await`ed in dynamic routes.
- `scripts/*.ts` are excluded from the app tsconfig — they run via `tsx` directly. Don't import from `scripts/` into `src/`.
- `web/prisma/seed.js` (CommonJS) is excluded from tsc.
- Tailwind v4 uses `@theme inline` in `globals.css`, not the v3 `tailwind.config.js` content section.

## Open questions for the user

None right now.
