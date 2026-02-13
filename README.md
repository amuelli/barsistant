# Barsistant (Next.js + Deno)

This project is set up with Next.js at the repository root and uses Deno tasks
to run it.

## Setup

```bash
deno install --allow-scripts=npm:sharp
npm install convex
npx convex dev
```

`npx convex dev` will create the `convex/` directory and update `.env.local`
with `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT`.

## Run

```bash
deno task dev
```

Open `http://localhost:3000`.

## Build and Start

```bash
deno task build
deno task start
```

Health check endpoint:

```bash
curl http://localhost:3000/api/health
```

Startup smoke check (expects built app, then verifies `/api/health`, `/`
including the `barsistant-shell-v1` app-shell marker, and `POST /api/imports`
returns `202 queued`):

```bash
deno task smoke:health
```

## Lint and Check

```bash
deno task fmt
deno task lint
deno task test
deno task typecheck
deno task smoke:health
deno task check
```
