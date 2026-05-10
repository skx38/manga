# Contributing

Welcome! This doc covers how to set up a dev environment and the workflow for landing a change.

## 1. Prerequisites

- **Node** 20.x or newer (`nvm install 20` if you don't have it)
- **npm** 10.x (ships with Node 20)
- **Docker** + Docker Compose (for the dev databases)
- **Git** with SSH set up against GitHub

## 2. First-time setup

```bash
git clone git@github.com:skx38/manga.git
cd manga

# Start Postgres in the background
docker compose up -d postgres

# Install web app
cd web
npm install
cp .env.example .env.local

# Apply schema + seed a small dataset
npx prisma db push
npx prisma db seed

# Run the dev server
npm run dev
```

Open <http://localhost:3000>. If anything is broken, see *Troubleshooting* in the root `README.md`.

## 3. Branching and PRs

- Branch off `main`: `git checkout -b feat/<short-name>` (or `fix/`, `chore/`, `docs/`).
- Keep PRs focused. One feature or one fix per PR.
- Open a PR back into `main`. CI must be green before merge.
- Use squash-merge so `main` history stays linear.

## 4. Code style

- **TypeScript strict.** No `any` unless commented-justified.
- **Server components by default.** Add `'use client'` only when you need state, refs, or browser APIs.
- **Use design tokens.** Pull colors from `web/src/app/globals.css` (`bg-background`, `text-foreground`, `bg-card`, …). Don't hardcode `bg-gray-900` / hex codes.
- **Reuse, don't duplicate.** Before adding a util, search `web/src/lib/`. Before adding a UI primitive, check `web/src/components/ui/` (shadcn).
- **No commented-out code.** If you don't need it, delete it. Git remembers.
- **Keep PRs small.** > 800 lines of diff is a code smell — split it.

## 5. Database changes

Always go through Prisma:

```bash
# After editing web/prisma/schema.prisma:
npx prisma migrate dev --name <descriptive_change>
```

This generates a migration in `web/prisma/migrations/`. **Commit it** with your change. Never edit a migration after it has merged into `main` — write a new one instead.

## 6. Pre-push checklist

```bash
cd web
npx prisma generate
npx tsc --noEmit
npm run lint
npm run build
```

If any of these fail, fix them before pushing.

## 7. Adding env vars

1. Add it to `web/.env.example` with a comment explaining where to get the value.
2. Reference it via `process.env.MY_VAR`. If it must exist at boot, fail fast with a clear error.
3. Mention the new var in the PR description so reviewers can update their `.env.local`.

## 8. Shadcn / UI components

- Add primitives via `npx shadcn@latest add <name>`. They land in `web/src/components/ui/`.
- Custom feature components go in `web/src/components/<feature>/`.
- Use `lucide-react` for icons, not emoji.

## 9. Testing

- For now, lint + tsc + build are the CI gates.
- Smoke tests live in `web/tests/` (Playwright). Add one when you ship a user-visible feature.

## 10. Need help?

Open a draft PR early and tag a teammate, or drop a question in the team chat. Don't sit on a blocker.
