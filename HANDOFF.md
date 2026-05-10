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

Full plan is committed at the repo root as **`PLAN.md`** — read that for the detailed approach. The phase table below is the live status tracker.

## Phase status

| Phase | Status | Notes |
| --- | --- | --- |
| 0. Repo hygiene | ✅ Done | Deleted ~40 log/test/cleanup scripts, consolidated `seeder/` + `seeder_v2/`, removed committed `.env`s, added root `.gitignore`, `README.md`, `CONTRIBUTING.md`, `web/.env.example`. |
| 1. Critical bugs | ✅ Done | Deleted dead stubs `Reader.tsx` + `CommentsSection.tsx`. Fixed async `params` in `u/[username]/page.tsx`. Fixed tsconfig `exclude` for scripts. `tsc --noEmit` clean. |
| 2. NextAuth + auth plumbing | ✅ Done | `web/src/lib/auth.ts` (authOptions, PrismaAdapter, Discord/Google/Credentials), `web/src/app/api/auth/[...nextauth]/route.ts`, `web/src/lib/session.ts` (`getCurrentUserId` + `getCurrentUserIdOrDemo`), `web/src/types/next-auth.d.ts`, `AuthProvider`/`ThemeProvider` wrappers. All 37 `demo_user_id` literals replaced. |
| 3a. Design tokens + layout + ThemeProvider | ✅ Done | OKLCH palette in `globals.css` with `--brand`, `--success`, `--warning`, `--vote-up/down`, motion tokens, `.glass`, `.aspect-cover`, `.eink-mode`, `.skeleton`. `layout.tsx` uses `bg-background text-foreground`, wraps with AuthProvider + ThemeProvider. Geist fonts. |
| 3b. Navbar redesign | ✅ Done | Sticky glass blur, active route highlighting, desktop search, theme cycle toggle, `useSession()` auth state, working mobile Sheet drawer. |
| 3c. Homepage + ComicCard | ✅ Done | `SectionHeader` component, grid `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6`, type-colored badges, `aspect-cover`, `next/image`, ring-brand focus states. |
| 3d. Search tri-state filter UI | ✅ Done | `FilterPanel` upgraded with grouped accordion (Demographic/Format/Genre/Theme), included (green) + excluded (red) tag chips, active-filter strip. |
| 3e. Reader polish + e-ink + prefetch | ✅ Done | `StripReader` IntersectionObserver prefetch (PREFETCH_AHEAD=5), placeholder skeletons, `eink-mode` class. `ReaderSettings` E-Ink toggle switch. `readerStore` `einkMode` state persisted. |
| 3f. Community threading + spoiler + vote | ✅ Done | `PostCard` migrated to semantic tokens, `active:scale-75` vote micro-interactions, fixed vote API body. `PostThread` vertical thread guide lines, depth-cap at 4 with collapsible replies, `VotePill` component. Vote API routes read userId from session. |
| 3g. Library tabs + empty states + loading/error | ✅ Done | `LibraryContent` semantic tokens, empty-state per filter. `FolderList` semantic tokens, status-color tokens. `loading.tsx` for /, /search, /library, /reader, /community. Root `error.tsx` boundary with retry. |
| 4a. Streaks | ✅ Done | `reader/progress/route.ts` — when a chapter is first completed (scroll >85%), updates `User.streakDays` and `User.lastReadDate`: extend if yesterday, reset if gap > 1 day. |
| 4b. Danmu (bullet comments) | ✅ Done | `DanmuComment` model added to schema. `GET/POST /api/community/danmu` endpoints (session-derived userId, 120-char cap). `DanmuOverlay.tsx` component with right-to-left CSS keyframe animation, optimistic spawn on submit, input focus pauses keyboard nav. Wired into `PageReader`; toggle in `ReaderSettings` + `readerStore.danmuEnabled`. Hidden in e-ink mode. **Note:** run `npx prisma migrate dev --name add_danmu_comment` against your dev DB. |
| 5a. Community security fixes (BLOCKER) | ✅ Done | `POST /community/posts` derives userId from session (was trusting client body — IDOR fix). Added `PATCH` (edit own post, sets editedAt) and `DELETE` (soft delete) handlers. Added ownership checks (403) to comment DELETE/PATCH; PATCH now stamps `editedAt`. New `web/src/lib/rateLimit.ts` token-bucket helper applied: 5/min posts, 10/min comments, 60/min votes (returns 429). Schema: Post got `editedAt`, `isDeleted`, `isLocked`, `isPinned`, `isRemoved` + indices `(comicId, createdAt)`, `(userId)`. Comment got `editedAt` + indices `(postId, parentId)`, `(userId)`. Vote got `(postId)`, `(commentId)` indices. **Note:** run `npx prisma migrate dev --name community_security_indices` against your dev DB. |
| 5b. Data unification (chapter discussions = Posts) | ⏳ Pending | Reader chapter comments and community posts become the same rows so votes never split. `Post.kind` enum + `Post.chapterId`, `ensureChapterDiscussion()` helper, one-shot data migration repointing existing `Comment.chapterId` rows under auto-Posts. See PLAN.md §5b. |
| 5c. Reddit core UX | ⏳ Pending | `/c/{slug}` per-comic pages (rules + mod list), CreatePostModal type picker (TEXT/LINK/IMAGE), single-comment permalinks, FTS search, Controversial sort. See PLAN.md §5c. |
| 5d. Engagement & social | ⏳ Pending | Real Saved (bookmark button is currently no-op), `@mention` parsing + Notifications model + bell icon in Navbar, karma counters on `/u/{username}`, nightly karma cron. See PLAN.md §5d. |
| 5e. Moderation tools | ⏳ Pending | Report model + mod queue at `/c/{slug}/mod`, `ComicMod` join table, lock/pin/remove/distinguish actions, banned-words auto-flag. See PLAN.md §5e. |
| 4c. Mihon/Tachiyomi import | ⏳ Pending | `protobufjs` + Mihon schema decoder in `api/library/import`. |
| 4d. Wait-to-Read | ⏳ Pending | `Chapter.unlocksAt` field + reader gate + countdown UI. |
| 5. Verification + CI | 🔧 In progress | GitHub Actions `.github/workflows/ci.yml` created (tsc + lint + build). Still need full `tsc --noEmit` clean pass on main app. |

## Where to pick up

Phases 0–4b are **complete**. CI workflow is in place. **Phase 5 (Community Reddit-Grade Overhaul)** is approved and the next focus.

**Next task — Phase 5a (BLOCKER, security):**
1. `web/src/app/api/community/posts/route.ts` — replace client-supplied `userId` (line 174) with `getCurrentUserIdOrDemo()`. Drop the dead upsert at lines 181-191. Add `PATCH` (edit own post) + `DELETE` (soft delete) handlers.
2. `web/src/app/api/comments/route.ts` — add `userId === comment.userId` ownership check to `DELETE` (line 78) and `PATCH` (line 101). Set `editedAt` on PATCH.
3. `web/src/lib/rateLimit.ts` (NEW) — token-bucket helper. Apply to post create (5/min), comment create (10/min), vote (60/min).
4. `web/prisma/schema.prisma` — add soft-delete/lock/pin fields to Post; `editedAt` to Comment; indices on Post(comicId, createdAt), Post(userId), Comment(postId, parentId), Comment(userId), Vote(postId), Vote(commentId).
5. `npx prisma migrate dev --name community_security_indices` then `tsc --noEmit && lint && build` clean.

After 5a passes verification, proceed to 5b (data unification — auto-Post per chapter). Full details in `PLAN.md`.

## Local dev quickstart

```bash
docker compose up -d postgres
cd web
cp .env.example .env.local         # generate NEXTAUTH_SECRET: openssl rand -base64 32
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
- Use design tokens from `web/src/app/globals.css` (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, etc.) — **never** hardcode `bg-gray-900` / hex colors.
- shadcn primitives go in `web/src/components/ui/` via `npx shadcn@latest add <name>`.
- Lucide icons, never emoji, for UI chrome.
- Prisma migrations are committed; never edit one after merge.

## Known gotchas

- Next.js 16 requires `params` to be `Promise<{...}>` and `await`ed in all dynamic routes.
- `scripts/*.ts` are excluded from the app tsconfig — run via `tsx` directly. Don't import from `scripts/` into `src/`.
- `web/prisma/seed.js` (CommonJS) is excluded from tsc.
- Tailwind v4 uses `@theme inline` in `globals.css`, not the v3 `tailwind.config.js` content section.
- Vote APIs (`/api/community/posts/vote`, `/api/comments/vote`) derive `userId` from session — do **not** pass it in the request body.
- `DEV_DEMO_USER_ID` env var lets you test without OAuth in dev; leave it empty in production.

## Open questions for the user

None right now.
