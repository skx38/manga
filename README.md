# OmniRead

The ultimate digital comics platform — Webtoons, Manga, Manhwa, Manhua — with a hybrid reader, advanced discovery, and a real community layer.

See [`prd.md`](./prd.md) for product spec, [`tech_spec.md`](./tech_spec.md) for architecture, [`ui_wireframes.md`](./ui_wireframes.md) for UI intent.

## Repo layout

```
manga/
├── web/            Next.js 16 + React 19 + Prisma + Tailwind v4 web app
├── seeder/         One-shot Prisma seeder (run from repo root with docker-compose up)
├── backend/        (Reserved) Go ingestion microservice
├── docker-compose.yml   Postgres + MongoDB + Meilisearch (dev only)
└── prd.md / tech_spec.md / ui_wireframes.md
```

## Quick start (5 min)

You need **Node 20+**, **npm**, and **Docker**.

```bash
# 1. Clone and install
git clone git@github.com:skx38/manga.git
cd manga/web
npm install
cp .env.example .env.local
# (edit .env.local — at minimum DATABASE_URL is preset for the docker-compose default)

# 2. Start Postgres (and friends) in the background
cd ..
docker compose up -d postgres

# 3. Apply schema and seed
cd web
npx prisma migrate deploy   # or `npx prisma db push` for first-time bootstrap
npx prisma db seed          # uses prisma/seed.js — small built-in dataset

# 4. (Optional) Pull a real catalog from Comick
node prisma/import-comick.js

# 5. Run the dev server
npm run dev
# → http://localhost:3000
```

## Common tasks

| What | Where |
| --- | --- |
| Add a UI route | `web/src/app/<segment>/page.tsx` (App Router, RSC by default) |
| Add an API route | `web/src/app/api/<segment>/route.ts` |
| Edit DB schema | `web/prisma/schema.prisma` then `npx prisma migrate dev --name <change>` |
| Add a shadcn primitive | `cd web && npx shadcn@latest add <component>` (config in `components.json`) |
| Run type check | `cd web && npx tsc --noEmit` |
| Run lint | `cd web && npm run lint` |
| Run a build | `cd web && npm run build` |

## Working with a teammate

1. **Branching** — `main` is protected. Create a feature branch off `main`:
   ```bash
   git checkout main && git pull
   git checkout -b feat/<short-name>
   ```
   Push and open a PR back into `main`.
2. **Env files** — never commit `.env*` (see `.gitignore`). Add new env vars to `web/.env.example` *and* mention them in your PR description.
3. **DB changes** — always go through `prisma migrate dev`. Commit the generated migration in `web/prisma/migrations/`. Don't edit committed migrations after they merge.
4. **Before you push** — run:
   ```bash
   cd web
   npx prisma generate
   npx tsc --noEmit
   npm run lint
   npm run build
   ```
5. **Code style** — TypeScript strict, server components by default, client components only when you need interactivity. Use the design tokens in `web/src/app/globals.css` rather than hardcoded colors.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the longer version.

## Troubleshooting

- **`P1001 can't reach database`** — `docker compose up -d postgres` and wait ~5s for the healthcheck.
- **Prisma client out of date** after pulling changes — `cd web && npx prisma generate`.
- **`next-auth` redirecting in a loop** — make sure `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set in `.env.local`.
- **Port 5432 already in use** — another Postgres is running locally; either stop it or change the host port in `docker-compose.yml`.
