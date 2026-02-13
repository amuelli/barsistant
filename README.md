# Barsistant (Next.js + Deno)

This project is set up with Next.js at the repository root and uses Deno tasks to run it.

## Setup

```bash
deno install --allow-scripts=npm:sharp
npm install convex
npx convex dev
```

`npx convex dev` will create the `convex/` directory and update `.env.local` with `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT`.

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

## Lint and Check

```bash
deno task lint
deno task typecheck
deno task check
```
