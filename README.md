# Barsistant (Next.js + Deno)

This project is set up with Next.js at the repository root and uses Deno tasks to run it.

## Setup

```bash
deno install --allow-scripts=npm:sharp
```

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
deno task check
```
