# OmniRead — Audit, Fix, and UI/UX Pro Max Overhaul

## Context

`manga fail` is **OmniRead**, a Next.js 16 / React 19 / Prisma / Tailwind v4 manga + community site. The PRD (a MangaDex/Bato.to/Webtoon competitor with hybrid reader, tri-state tag search, community, gamification, MAL/AniList sync) is ambitious but execution lags badly:

- **UI is visually incoherent** — hardcoded `bg-black text-white` in `src/app/layout.tsx:21` overrides the well-designed light/dark token palette in `src/app/globals.css`. Section headers use raw emoji (📊 🎯 📈 ✨), there is no design system, and styles drift between `bg-gray-900` hardcodes and `bg-card` semantic tokens.
- **Auth is fake** — 37 call sites hardcode `userId = 'demo_user_id'`. `next-auth` is in `package.json` but `app/api/auth/` does not exist.
- **Reader has a dead stub** — `src/components/Reader.tsx:71` literally renders "Manga Mode Not Implemented Yet". The real reader (`src/components/reader/ReaderContainer.tsx` + `StripReader`/`PageReader`) is the one wired into `app/reader/[id]/page.tsx`. The legacy stub should be deleted.
- **Repo hygiene is bad** — ~40 ad-hoc `test_*.js`, `cleanup_*.js`, `*_log*.txt`, `tsc_output*.txt`, `prisma_log.txt`, `ip_info.txt`, `prisma.config.ts.bak2`, two duplicate `seeder/` and `seeder_v2/` dirs. `.env` files committed under `seeder/` and `seeder_v2/`.
- **PRD-promised features are missing**: tri-state (Include/Exclude/**Optional**) tag UI is only two-state, no danmu, no spoiler auto-collapse on new chapters, no E-Ink mode, no auto-crop, no smart landscape split, no preloading, no wait-to-read, no streaks, no 2-way MAL/AniList sync, no creator drop-off heatmap, no AI alt-text.
- **TS errors** in `web/tsc_output.txt` from Next 15→16 async `params` type changes in `app/api/reader/[chapterId]/route.ts`.

Goal: keep the existing stack (it's the right call — Next.js + Prisma + Tailwind v4 matches MangaDex-web/Suwayomi-WebUI patterns and the PRD's SSR/SEO requirement), then fix bugs, finish the headline features, and ship a coherent UI/UX-Pro-Max design system. Reference projects: **Suwayomi-WebUI** (reader chrome, settings shape), **MangaDex web** (advanced filter UI, tag taxonomy), **Comick** (card grid, dark palette), **Tachiyomi/Mihon** (backup parsing, library schema).

## Stack decision

**Keep**: Next.js 16 (App Router, RSC), Prisma + Postgres, Tailwind v4 + shadcn-style tokens, Zustand, next-themes, lucide-react, recharts.
**Add**: shadcn/ui primitives (Dialog, Tabs, Sheet, Toast, Tooltip, Popover, Command, Skeleton) — `components.json` is already present, so `npx shadcn@latest add` works. **Drop**: `Reader.tsx` (legacy stub), `webtorrent`/`nyaapi` (out of scope, security risk, bundle bloat).

## Plan

### Phase 0 — Repo hygiene (fast)
- Delete: all `web/build_log_*.txt`, `web/tsc_output*.txt`, `web/dev_log.txt`, `web/ingest_log_*.txt`, `web/prisma_log.txt`, `web/prisma_gen_log*.txt`, `web/verify_log*.txt`, `web/debug_*.log`, `web/debug-output.txt`, `web/ip_info.txt`, `web/*_test.txt`, `web/search_result.json`, `web/prisma.config.ts.bak2`, `web/test_*.js`, `web/cleanup_*.js`, `web/verify_*.js`, `web/check_*.js`, `web/migrate_user.js`, `web/seed_from_api.js`, `web/seed_stats.ts`, `web/debug-comics.ts`.
- Consolidate `seeder/` and `seeder_v2/` → single `seeder/` (keep `seeder_v2`'s `seed_quick.ts`, drop the rest). Remove committed `.env` files; add to `.gitignore`.
- Add `.gitignore` entries for `*.log`, `build_log_*.txt`, `tsc_output*.txt`, `seeder/.env`, `web/.env*`.
- Move ad-hoc scripts that are still useful into `web/scripts/` (e.g. cover refresh) and document in `web/README.md`.

### Phase 1 — Critical bug fixes
- **Async `params` fix** (Next 16): update every `app/api/**/route.ts` and dynamic page where params is typed sync. Pattern: `{ params }: { params: Promise<{ id: string }> }` then `const { id } = await params;`. Files flagged in `tsc_output.txt`: `app/api/reader/[chapterId]/route.ts` (and audit all `[id]`/`[chapterId]` routes).
- **Delete dead stub**: `web/src/components/Reader.tsx` and `web/src/components/CommentsSection.tsx` (root-level legacy duplicates of the ones inside `components/reader/` and `components/community/`). Re-point any imports.
- **Run `npx tsc --noEmit`** clean before moving on.

### Phase 2 — Auth (unblocks everything else)
- Wire NextAuth at `web/src/app/api/auth/[...nextauth]/route.ts` with **Credentials** + **Discord** + **Google** providers (Discord because manga community lives there; defer MAL/AniList — they go in Phase 6 as 2-way sync providers, not login).
- Add `User`, `Account`, `Session`, `VerificationToken` models to `web/prisma/schema.prisma` (Prisma + NextAuth adapter pattern).
- Replace all 37 `demo_user_id` literals with `await getServerSession()` / `auth()` helper at `web/src/lib/auth.ts`. For unauthenticated routes, return 401 instead of silently using a fake user.
- Add a `<SessionProvider>` and a real account menu in `Navbar.tsx`.

### Phase 3 — UI/UX Pro Max design system
This is the biggest visible win. Reference: shadcn defaults + MangaDex's dense card grid + Suwayomi's reader chrome.

**Tokens** (`web/src/app/globals.css`):
- Keep the OKLCH palette already present, but **add brand colors**: `--brand: oklch(0.62 0.20 265)` (electric indigo), `--brand-foreground`, `--accent-pink: oklch(0.70 0.22 0)` for highlights/CTAs, `--success`, `--warning`. Replace ad-hoc `vote-up/down` hex with these.
- Add typography scale: ship `Geist` + `Geist Mono` via `next/font/google` (already referenced in tokens but Inter is loaded — switch to Geist for consistency with shadcn).
- Add motion tokens: `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`, durations 150/250/400ms.

**Layout** (`web/src/app/layout.tsx`):
- Remove hardcoded `bg-black text-white` — replace with `bg-background text-foreground`.
- Wrap with `next-themes` `ThemeProvider` (already a dep). Default to dark, allow system/light. Set `<html suppressHydrationWarning>`.
- Add `<Toaster />` (sonner via shadcn).

**Navbar** (`web/src/components/Navbar.tsx`):
- Sticky, glass blur (`backdrop-blur supports-[backdrop-filter]:bg-background/60`), border-bottom on scroll.
- Logo + global Command-K search (`cmdk`/shadcn `Command`) + nav (Home, Browse, Library, Community) + theme toggle + account menu (avatar `DropdownMenu`).
- Mobile: `Sheet` drawer (currently the mobile button is a no-op placeholder).

**Homepage** (`web/src/app/page.tsx`):
- Replace emoji headers with a `<SectionHeader icon={Flame} title="Trending" href="/search?sort=rating" />` component using lucide icons.
- HeroCarousel: keep, but add `next/image` with priority + gradient fade and a primary CTA. Add `Recently Updated` strip and `Continue Reading` rail to the rotation.
- Card grid: standardize at `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4` with consistent 2:3 aspect ratio.

**ComicCard** (`web/src/components/ComicCard.tsx`):
- `next/image` with explicit aspect-ratio, blurDataURL placeholder, hover lift + scrim with title/rating/chapter count, status pill (top-right), "+" library quick-add button, focus ring (`focus-visible:ring-2 ring-brand`).

**Search** (`web/src/app/search/page.tsx` + `components/search/FilterPanel.tsx`):
- Implement **tri-state** tag chips per `ui_wireframes.md` (grey → green include → red exclude → grey). URL state `?included=…&excluded=…&optional=…`. Update Prisma `where` to support `optional` as `OR`.
- Group tags by Demographics / Format / Genres / Themes / Status with collapsible sections (`Accordion`).
- Active-filter strip above results; results-empty state with a "clear filters" CTA.

**Reader** (`web/src/components/reader/*`):
- Auto-hide chrome with fade (250ms `--ease-out`); top bar shows breadcrumb (Series → Ch N — Title), bottom bar shows page slider + prev/next chapter, settings sheet on right.
- Keyboard: ←/→ (LTR/RTL aware), space, F (fullscreen), M (chrome), S (settings), Home/End. Hint overlay first-use.
- **Manga Mode polish**: Smart Landscape Split (detect double-page via aspect ratio > 1.4, render full-width or two-up). RTL toggle persisted in user settings.
- **Webtoon Mode polish**: gapless `display:block` already done; add IntersectionObserver-based prefetch of next 5 images, IntersectionObserver-based progress reporting.
- **E-Ink Mode**: add to `ReaderSettings` — disables transitions (`* { transition: none !important }`), forces high-contrast B&W via CSS filter, switches webtoon to paginated.
- Image proxy already exists at `app/api/proxy` — use it via `next/image` `loader` so external CDN images can be cached/optimized.

**Community** (`web/src/app/community/*` + `components/community/*`):
- Threaded comments visual: vertical guide lines from parent, depth-cap at 4 with "view replies" beyond.
- Spoiler markup `>!…!<` already parsed — extend: posts/comments on chapters newer than user's progress collapse the whole comment behind a "May contain spoilers" curtain.
- Vote button: scale-on-press, optimistic update, undo via toast.
- Submit form: rich-textarea (textarea + markdown helpers), spoiler-tag button, image upload via `app/api/proxy` or signed-URL upload.

**Library** (`web/src/app/library/page.tsx`):
- Tabs for Reading / Completed / On Hold / Dropped / Plan to Read with counts.
- Folder grid with cover-collage, share toggle, drag-to-reorder (`@dnd-kit/core`).
- Empty state per tab.

**Loading/empty/error**:
- Add `loading.tsx` and `error.tsx` per route segment with Skeletons matching the actual layout.
- Replace text "Loading…" strings with skeletons.

**Accessibility pass**:
- All interactive elements: `aria-label`, focus-visible ring (`outline-ring/50` already in `globals.css:130` — verify it triggers).
- Cards: wrap whole card in `<Link>` and use `<h3>` for title.
- Reader images: alt text fallback to `Page ${i+1} of ${chapter.title}`.
- Color contrast: bump `--muted-foreground` in dark to oklch(0.78) for AA.

### Phase 4 — Feature gaps from PRD
Priority order (community-first per user's ask):
1. **Spoiler auto-collapse on new chapters** — needs reader progress lookup; data already in `ReadingProgress`.
2. **Danmu (bullet comments)** — overlay on top of reader, scrolls right→left across image height bands. New `DanmuComment` Prisma model `(chapterId, pageIndex, timeOffsetMs, text, userId, createdAt)`. SSE endpoint `app/api/community/danmu/stream` for live, REST for backfill. Toggle in `ReaderSettings`.
3. **Tri-state Optional tag** — see Phase 3 search.
4. **Tachiyomi/Mihon backup import** — `app/api/library/import/file` already accepts JSON; add Mihon protobuf decoder via `protobufjs` against the published Mihon schema.
5. **2-way MAL/AniList sync** — extend NextAuth Account model, add `app/api/sync/external`, push on `ReadingProgress` upsert via a queued job table polled by a `node` cron route.
6. **Wait-to-Read** — add `Chapter.unlocksAt: DateTime?` and a `lockedFreeUsers` boolean; reader checks; UI shows countdown.
7. **Streaks** — `User.streakDays`, `User.lastReadAt`, `User.freezeTokens`. Daily upsert when first chapter is read.
8. **AI alt-text** — background worker (next route + queue) calls vision API on new pages; store on `Page.altText`. Defer.

### Phase 5 — Verification
- `cd web && npx prisma generate && npx tsc --noEmit && npm run lint && npm run build` — all clean.
- `docker compose up -d postgres` and run seeder; confirm homepage loads with real data.
- Manual smoke (record in `web/README.md` test plan):
  - Sign in with Discord → account menu shows avatar.
  - Search: tap Fantasy include, Harem exclude, Romance optional → URL reflects, results match.
  - Comic page: add to library, change status, open chapter.
  - Reader: webtoon scroll + progress saved; manga mode keyboard nav LTR/RTL; settings persist.
  - Community: post creation, comment + reply, vote, spoiler curtain.
  - Library: tabs, folder create + share link.
  - Lighthouse: ≥ 90 on Performance/A11y/Best-Practices/SEO on `/`, `/comic/[id]`, `/search`.
- Add a minimal Playwright smoke at `web/tests/smoke.spec.ts` for: home loads, search filters, sign-in stub, reader keyboard nav.
- GitHub Action `.github/workflows/ci.yml`: install → prisma generate → tsc → lint → build → playwright. Catches the kinds of TS errors currently checked into log files.

## Critical files to modify

- `web/src/app/layout.tsx` — theme provider, drop hardcoded colors.
- `web/src/app/globals.css` — extend tokens (brand, motion, contrast).
- `web/src/app/page.tsx` — section headers, card grid, hero polish.
- `web/src/components/Navbar.tsx` — full redesign (cmdk, sheet, account menu).
- `web/src/components/ComicCard.tsx` — next/image, scrim, focus, quick-add.
- `web/src/components/reader/ReaderContainer.tsx`, `StripReader.tsx`, `PageReader.tsx`, `ReaderSettings.tsx` — chrome anim, e-ink mode, smart split, prefetch, danmu overlay.
- `web/src/components/search/FilterPanel.tsx` + `web/src/app/search/page.tsx` — tri-state + grouped accordion + active-filter chips.
- `web/src/components/community/PostCard.tsx`, `CommentsSection.tsx` — threading visuals, spoiler curtain, vote micro-interactions.
- `web/src/app/library/page.tsx` — tabs, folders.
- `web/src/app/api/auth/[...nextauth]/route.ts` (new) + `web/src/lib/auth.ts` (new).
- `web/prisma/schema.prisma` — NextAuth tables, `DanmuComment`, `User.streakDays/freezeTokens`, `Chapter.unlocksAt`, `Page.altText`.
- `web/src/components/Reader.tsx`, `web/src/components/CommentsSection.tsx` — **delete** (legacy duplicates).

## Reused existing code

- `web/src/lib/comick.ts`, `prisma/import-comick.js` — keep, that is the data source.
- `web/src/lib/recommendations.ts`, `gamification.ts`, `import-utils.ts` — extend, don't replace.
- `web/src/components/reader/ReaderContainer.tsx` (the real reader) — already has webtoon/manga/RTL/keyboard/fit modes; we polish rather than rebuild.
- `web/src/app/api/proxy` — image proxy used by `next/image` loader.
- shadcn config (`components.json`) — already configured, so `npx shadcn@latest add button card dialog sheet tabs accordion command tooltip popover skeleton sonner dropdown-menu` works out of the box.

---

# Phase 5 — Community: Reddit-Grade Overhaul

## Context

Phases 0–4b shipped a working community surface (posts, threaded comments, votes, danmu) but a focused audit revealed three classes of problem:

**Critical security bugs:**
1. `POST /api/community/posts` (route.ts:174) destructures `userId` from the request body — any unauthenticated client can post as any user. The `getCurrentUserIdOrDemo()` helper exists and is used elsewhere in the codebase but is not called here.
2. `DELETE` and `PATCH` on `/api/comments` (route.ts:78–116) perform no ownership check — any caller can edit or delete any comment by ID.

**Disconnected data pools:**
A `Comment` row stores *either* `chapterId` (reader comment) *or* `postId` (community-post comment). The same conversation about Chapter 42 lives in two physically separate threads with separate vote tallies — even though every other table is correctly singular (one `Comic`, one `Post`, one `Vote`, one `User`). A user who upvotes a chapter comment in the reader is **not** crediting the same comment that appears on the community page, because they're different rows. The fix is to make every chapter discussion a real `Post` so both surfaces render the same rows and share the same `Vote` tallies.

**Missing Reddit table stakes:**
Saved posts (the `<Bookmark>` button in `PostCard.tsx` is a no-op), single-comment permalinks, post editing, reports/mod queue, lock/pin/remove, `@mention` notifications, per-comic community pages with rules and mod lists, user karma, and the "Controversial" sort.

Goal: close the security gaps, unify the data model so votes can never get split, then ship Reddit's table-stakes UX. Stay on the existing stack (Prisma + Next API routes + Tailwind tokens).

## Sub-phases (ship in order)

### 5a — Security & ownership fixes (BLOCKER, ship first)

Critical files:
- `web/src/app/api/community/posts/route.ts` — `POST` (line 171): replace `const { ..., userId, ... } = body` with `const userId = await getCurrentUserIdOrDemo(); if (!userId) return 401;`. Drop the dead `if (!userId)` upsert block at lines 181–191. Add a new `PATCH` handler (edit own post: title/content/flair, ownership check, sets `editedAt`) and `DELETE` handler (soft-delete via `isDeleted` flag).
- `web/src/app/api/comments/route.ts` — `DELETE` (line 78) and `PATCH` (line 101): add `const userId = await getCurrentUserIdOrDemo()` + `if (comment.userId !== userId) return 403`. Mark `editedAt` on PATCH.
- `web/src/lib/rateLimit.ts` (NEW) — tiny in-memory token-bucket helper keyed by `${userId}:${action}`. Apply to post create (5/min), comment create (10/min), vote (60/min), report (5/min). Exported as `rateLimit(userId, action, max, windowMs)`.
- `web/prisma/schema.prisma` — add to `Post`: `isDeleted Boolean @default(false)`, `editedAt DateTime?`, `isLocked Boolean @default(false)`, `isPinned Boolean @default(false)`, `isRemoved Boolean @default(false)`. Add to `Comment`: `editedAt DateTime?`. Add `@@index([comicId, createdAt])` and `@@index([userId])` to `Post`. Add `@@index([postId, parentId])`, `@@index([userId])` to `Comment`. Add `@@index([postId])`, `@@index([commentId])` to `Vote`.

Reuse: `getCurrentUserIdOrDemo` from `web/src/lib/session.ts` (already used 30+ places).

Migration: `npx prisma migrate dev --name community_security_indices`.

### 5b — Data unification (chapter discussions = Posts)

The reader's chapter comments and the community's chapter discussions become the same physical rows, so a vote in the reader is the same vote on the community page — by virtue of being a single `Vote(commentId=X)` row, not by syncing two stores.

Critical files:
- `web/prisma/schema.prisma` —
  - `Post`: add `kind PostKind @default(USER)` (enum `USER | CHAPTER_DISCUSSION`), `chapterId String?` (nullable FK with `@@unique([kind, chapterId])` so each chapter has at most one CHAPTER_DISCUSSION post), and `chapter Chapter? @relation(...)`. Make `title` nullable for auto-posts (or default it to `"Ch ${number}: ${chapterTitle}"` — pick the latter to avoid nullability sprawl).
  - `Chapter`: add inverse relation `discussion Post?`.
- `web/src/lib/chapterDiscussion.ts` (NEW) — `ensureChapterDiscussion(chapterId): Promise<Post>` helper. Lazy `upsert`: returns the existing CHAPTER_DISCUSSION post or creates one with auto-title. Called from comment-create and from any UI surface that needs the post id.
- `web/src/app/api/comments/route.ts` (POST) — drop the `chapterId` branch; if the request supplies `chapterId`, internally call `ensureChapterDiscussion(chapterId)` and store the comment with `postId = post.id` (and leave `chapterId` null). One canonical column means every Comment-render query is now `where: { postId }`.
- `web/src/app/api/comments/route.ts` (GET) — `?chapterId=X` keeps working: resolve to the canonical post via `ensureChapterDiscussion` and return its comments.
- `web/src/components/reader/CommentSection.tsx` (or wherever reader comments render) — call `GET /api/comments?chapterId=X` (unchanged behaviour) but the underlying data is now the same as the community surface. Add a header link "View on community →" that deep-links to the canonical post.
- `web/src/app/c/[slug]/page.tsx` (5c, see below) — the comic feed includes both `kind: USER` and `kind: CHAPTER_DISCUSSION` posts. Optional tab to filter just chapter threads.
- `web/prisma/migrations/<ts>_unify_chapter_discussions/migration.sql` (NEW, one-shot data migration) — for every chapter that already has comments with non-null `chapterId`:
  1. Insert a CHAPTER_DISCUSSION `Post` row with `chapterId, comicId` and `userId = comic.creatorId ?? <SYSTEM_USER>`.
  2. Update those comments: `SET postId = <new post id>, chapterId = NULL`.
  3. Existing `Vote(commentId=…)` rows are unaffected — they keep pointing at the same `Comment.id`, which now lives under the new Post. Vote tallies survive.
- A `User.id = '__system__'` row is seeded if not present (used as the implicit author of CHAPTER_DISCUSSION posts and never displayed as a clickable user).

After this migration, `Comment.chapterId` is **always null** for new comments and the reader/community surfaces are guaranteed to be one source of truth. We can delete `Comment.chapterId` in a follow-up phase once all callers are migrated; for safety we leave it as a deprecated nullable column for now.

Verification (5b):
- Pre-migration sanity: `SELECT COUNT(*) FROM "Comment" WHERE "chapterId" IS NOT NULL;` → record count.
- Run migration. Re-run query → 0 (all repointed). `SELECT COUNT(*) FROM "Post" WHERE kind = 'CHAPTER_DISCUSSION';` matches the number of distinct chapters that had comments.
- Vote a chapter comment in the reader, refresh the community page → score reflects in both. Vote it again from the community page → toggles back to 0 (one Vote row per user-comment).

### 5c — Reddit core UX

Critical files:
- `web/src/app/c/[slug]/page.tsx` (NEW) — per-comic community page. Reuse `getData()` pattern from `web/src/app/comic/[id]/page.tsx`. Renders: comic banner header (cover blur), feed of posts scoped to that `comicId` (reuse `CommunityFeed` with `comicId` prop), right sidebar with rules (read from new `Comic.communityRules` Json field) and mod list (`User[]` via new `ComicMod` join table). Slug-based route so URLs are pretty (`/c/one-piece`).
- `web/prisma/schema.prisma` — add `Comic.communityRules Json?`, new `ComicMod` model `(comicId, userId, role: "MOD"|"ADMIN", createdAt)` with `@@id([comicId, userId])`.
- `web/src/components/community/CreatePostModal.tsx` — add post-type picker (TEXT / LINK / IMAGE) using shadcn `Tabs`. The schema's `Post` model only stores `title`/`content`; encode link URL or image URL into `content` for now (defer adding a `Post.url` field unless you find a strong need). Add flair selector populated from a new `getCommunityFlairs(comicId)` helper that pulls distinct flair values from existing posts on that comic.
- `web/src/app/community/post/[id]/comment/[commentId]/page.tsx` (NEW) — single-comment permalink. Renders the same `PostThread` component but with `focusCommentId` prop that scrolls to and highlights that comment. `PostThread.tsx` already takes `postId`; add the optional `focusCommentId` prop and ref-based scrollIntoView.
- `web/src/app/api/community/posts/search/route.ts` (NEW) — `GET ?q=…&comicId=…` Postgres full-text on `Post.title` + `Post.content`. Use `prisma.$queryRaw` with `to_tsvector`. Wire to a search box in `Sidebar.tsx`.
- `web/src/app/api/community/posts/route.ts` — extend `sort` to handle `controversial`: `score ≈ 0` AND high vote count. Computed in-memory like `popular`: `(min(up,down) * 2) / (1 + abs(up-down))`.

Reuse: `web/src/components/community/CommunityFeed.tsx` already accepts `comicId` filtering via API. `PostCard.tsx`/`PostThread.tsx` only need the new permalink scroll-to behavior.

### 5d — Engagement & social

Critical files:
- `web/prisma/schema.prisma` — new models: `SavedItem (userId, postId?, commentId?, createdAt, @@unique([userId, postId]), @@unique([userId, commentId]))`, `Notification (id, userId, type: "REPLY"|"MENTION"|"MOD_ACTION", actorId?, postId?, commentId?, readAt?, createdAt)`, add `User.commentKarma Int @default(0)`, `User.postKarma Int @default(0)`.
- `web/src/app/api/saved/route.ts` (NEW) — GET (user's saved items), POST (save), DELETE (unsave). Wires the existing dead `<Bookmark>` button in `PostCard.tsx:222`.
- `web/src/app/saved/page.tsx` (NEW) — list of user's saved posts/comments with the same `PostCard` rendering.
- `web/src/app/api/notifications/route.ts` (NEW) — GET (paginated), PATCH (mark read). Triggered from comment-create + mention parse.
- `web/src/components/Navbar.tsx` — add bell icon with unread count badge, opens a `Popover` listing recent notifications (reuse `useSession()` already in place).
- `web/src/components/shared/RichTextParser.tsx` — extend to parse `@username` → `<Link href="/u/{username}" className="text-brand">`. On comment create in `web/src/app/api/comments/route.ts` POST, regex for `@(\w+)`, look up user IDs, insert `Notification` rows.
- `web/src/app/u/[username]/page.tsx` — show karma counters and a "Posts" / "Comments" tab grid (the page exists; just extend it).
- Karma: nightly Vercel cron at `web/src/app/api/cron/recompute-karma/route.ts` summing `Vote.value` for each user's posts/comments. Defer real-time karma updates.
- **Awards/reactions**: defer to "nice-to-have" — not in this phase. Documented as future work.

Reuse: `Vote` model already aggregates the data we need for karma. `RichTextParser` already handles `>!spoiler!<`; extend the same component.

### 5e — Moderation tools

Critical files:
- `web/prisma/schema.prisma` — `Report (id, reporterId, postId?, commentId?, reason: "SPAM"|"HARASSMENT"|"NSFW"|"SPOILER"|"OTHER", details?, status: "OPEN"|"RESOLVED"|"DISMISSED", resolvedById?, createdAt)`, indexed by `status, createdAt`. The `ComicMod` model from 5b is reused for permission checks.
- `web/src/app/api/reports/route.ts` (NEW) — POST (any logged-in user reports), GET (mods only, scoped to comics they moderate or all if `role=ADMIN`).
- `web/src/app/c/[slug]/mod/page.tsx` (NEW) — mod queue: open reports, lock/pin/remove buttons. Permission check via `ComicMod` table.
- `web/src/lib/permissions.ts` (NEW) — `isCommunityMod(userId, comicId)` helper used by 5a's PATCH/DELETE handlers (mods can edit anyone's content, with `isRemoved` flag set instead of hard delete) and the mod queue endpoint.
- `web/src/components/community/PostCard.tsx` — when `userMod === true`, render a "..." menu with Lock/Pin/Remove/Distinguish actions (call `PATCH /api/community/posts`). Add a "Mod" badge next to author name when `comment.user.id` is in the comic's mod list.
- Word filter: `Comic.bannedWords String[]` field, applied on comment/post create. Auto-flag (don't auto-delete) — creates a `Report` row with `reason: SPAM` and the post in `isRemoved: true` state.

Reuse: `getCurrentUserIdOrDemo` for auth, the new `ComicMod` join table for both 5b's mod list and 5d's permission gates.

## Verification

**5a (must pass before merging):**
```bash
cd web
npx prisma migrate dev --name community_security_indices
npx tsc --noEmit                  # clean
npm run lint                       # clean
npm run build                      # clean
```
Manual:
- POST `/api/community/posts` with `userId: "<someone-elses-id>"` in body → ignored, post created as session user (or 401 if signed out).
- Sign in as user A, comment. Sign in as user B, `DELETE /api/comments?id=<A's-comment>` → 403.
- Curl post-create 6× in a minute → 6th returns 429.

**5c:**
- Visit `/c/one-piece` → page renders comic-scoped feed and rules sidebar.
- Open `CreatePostModal`, switch to LINK tab, submit with URL → post visible with link icon.
- Click "Permalink" on a deep reply → URL is `/community/post/<id>/comment/<commentId>`, target comment scrolls into view + highlight ring fades after 2s.
- Search "spoiler" in community sidebar → returns posts with that word.

**5d:**
- Click `<Bookmark>` on a post → flips state, appears at `/saved`.
- Reply to user X's comment as user Y → user X has notification badge with unread:1; clicking opens popover, marking read decrements.
- `@username` in a new comment renders as `/u/username` link and creates a MENTION Notification.
- Run cron route manually → karma totals on `/u/{username}` match `SUM(Vote.value)` for that user's content.

**5e:**
- Non-mod hits `/c/one-piece/mod` → 403.
- Mod clicks "Lock" on a post → `Post.isLocked = true`, comment-create returns 403 with reason.
- File a report → appears in mod queue; mod resolves → `status = RESOLVED`.
- Banned word in `Comic.bannedWords` triggers auto-`Report` on create.

**End-to-end smoke (all phases):**
Add a Playwright spec at `web/tests/community.spec.ts` covering: sign in → create post → comment → reply with `@mention` → save → unsave → report → mod resolve.

## Critical files to modify (consolidated)

- `web/src/app/api/community/posts/route.ts` (security + PATCH/DELETE + controversial sort)
- `web/src/app/api/comments/route.ts` (ownership checks on PATCH/DELETE; route chapterId comments through `ensureChapterDiscussion`)
- `web/prisma/schema.prisma` (indices, soft-delete/lock/pin fields, `Post.kind` + `Post.chapterId`, `ComicMod`, `SavedItem`, `Notification`, `Report`, karma fields, `Comic.communityRules`, `Comic.bannedWords`)
- `web/prisma/migrations/<ts>_unify_chapter_discussions/migration.sql` (NEW, data migration backfilling chapter Post rows + repointing Comments)
- `web/src/lib/chapterDiscussion.ts` (NEW, `ensureChapterDiscussion` helper)
- `web/src/lib/rateLimit.ts` (NEW)
- `web/src/lib/permissions.ts` (NEW)
- `web/src/app/c/[slug]/page.tsx` (NEW)
- `web/src/app/c/[slug]/mod/page.tsx` (NEW)
- `web/src/app/community/post/[id]/comment/[commentId]/page.tsx` (NEW)
- `web/src/app/api/community/posts/search/route.ts` (NEW)
- `web/src/app/api/saved/route.ts` (NEW)
- `web/src/app/api/notifications/route.ts` (NEW)
- `web/src/app/api/reports/route.ts` (NEW)
- `web/src/app/api/cron/recompute-karma/route.ts` (NEW)
- `web/src/app/saved/page.tsx` (NEW)
- `web/src/components/community/CreatePostModal.tsx` (post type picker, flair)
- `web/src/components/community/PostCard.tsx` (real save, mod menu, mod badge)
- `web/src/components/community/PostThread.tsx` (focusCommentId prop)
- `web/src/components/Navbar.tsx` (notifications popover)
- `web/src/components/shared/RichTextParser.tsx` (@mention parsing)
- `web/src/app/u/[username]/page.tsx` (karma + post/comment tabs)

## Reused code (no rewrites needed)

- `web/src/lib/session.ts` `getCurrentUserIdOrDemo()` — apply everywhere missing.
- `web/src/components/community/CommunityFeed.tsx` — already supports `comicId` filtering via API param.
- `web/src/components/community/PostCard.tsx` — vote/spoiler/share already correct from Phase 3f.
- `web/src/components/community/PostThread.tsx` — depth-cap and threading guides already in place.
- `web/src/components/shared/RichTextParser.tsx` — already parses `>!spoiler!<`; extend with `@mention`.

---

## Out of scope (defer)

- Native mobile app (PRD says Flutter — separate workstream).
- Go microservices migration (PRD's stated backend choice; current Next API routes are fine for v1; revisit if scaling demands).
- Stripe/billing for Wait-to-Read monetization (schema-ready, UI-ready, but no payment).
- Creator dashboard with drop-off heatmap (data is collected; visualization later).
