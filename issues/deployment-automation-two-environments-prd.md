## Problem Statement

Barsistant can be deployed manually, but current deployment flow is not yet
defined as a repeatable, automated process across multiple environments.
Without that, releases are higher risk:

- Production can be updated without a consistent pre-production verification
  path.
- Backend and frontend deploy order can drift, causing runtime incompatibility.
- Environment-specific configuration (especially Convex URL and deploy keys)
  can be mixed up.

The immediate need is a clear, automated deployment model with preview,
staging, and production lanes that fits this stack: Next.js on Deno Deploy +
Convex backend.

## Solution

Establish an automated deployment pipeline for three lanes with explicit branch
triggers, separated secrets, and environment-specific Convex endpoints:

- `preview` creates multiple ad hoc Deno preview deployments (typically from
  PRs), all connected to one shared Convex preview deployment.
- `staging` deploys from `develop`.
- `production` deploys from `main`.
- Convex deploy runs first, then Deno Deploy app rollout.
- Existing `deno task check` remains the quality gate before any deployment.

This creates a stable promotion path and reduces human error in release
operations.

## User Stories

1. As an operator, I want every `main` merge to deploy consistently, so that
   production releases are predictable.
2. As an operator, I want a staging environment that mirrors production
   topology, so that I can validate behavior before release.
3. As a developer, I want environment-specific Convex URLs injected
   automatically, so I do not manually swap runtime config.
4. As a developer, I want deployment failures to stop before production impact,
   so that broken builds are blocked early.
5. As a product owner, I want reduced deployment risk while retaining iteration
   speed.
6. As a reviewer, I want ad hoc preview deployments from a PR, so I can quickly
   validate incoming changes before merge.

## Polishing Requirements

- Deployment workflows must be explicit and easy to audit in GitHub Actions.
- Error outputs should clearly identify whether failure occurred in quality
  checks, Convex deploy, or Deno app deploy.
- Secrets and runtime variables must be scoped per environment with no shared
  production keys in staging jobs.
- Documentation should provide one unambiguous operator flow.
- Preview behavior and ownership must be clear so parallel PR activity does not
  cause confusion.
- Configuration documentation must explicitly list required setup in GitHub,
  Deno Deploy, and Convex, including secrets, environment variables, branch
  mapping, and trigger behavior.

## Implementation Decisions

- Environment model:
  - `preview`: one shared Convex preview deployment + multiple ad hoc Deno
    preview deployments linked to that same Convex URL.
  - `staging`: dedicated Convex staging deployment + one dedicated Deno staging
    deployment.
  - `production`: dedicated Convex production deployment + one dedicated Deno
    production deployment.

- Branch strategy:
  - `pull_request` -> preview deploy workflow (ad hoc trigger from PR context).
  - `develop` -> staging deploy workflow.
  - `main` -> production deploy workflow.

- Phased rollout:
  1) Phase 1: establish stable `staging` and `production` automation.
  2) Phase 2: add ad hoc PR preview automation (multiple Deno previews pointing
     to shared Convex preview).

- Deployment order:
  1) Run `deno task check`.
  2) Deploy Convex (`npx convex deploy --cmd "deno task check"` or equivalent
     CI step with pre-run checks).
  3) Deploy Deno app after successful Convex deploy.

- Runtime config:
  - Deno Deploy environment variable `NEXT_PUBLIC_CONVEX_URL` must be set per
    context:
    - preview value(s) -> shared Convex preview URL.
    - staging value -> Convex staging URL.
    - production value -> Convex production URL.
  - Optional `CONVEX_DEPLOYMENT` may be set for tooling clarity.

- Secrets:
  - `CONVEX_DEPLOY_KEY_PREVIEW`
  - `CONVEX_DEPLOY_KEY_STAGING`
  - `CONVEX_DEPLOY_KEY_PRODUCTION`
  - Deno Deploy auth token/credentials scoped per environment as needed.

- Workflow files:
  - Keep `check.yml` as shared CI validation.
  - Add `deploy-preview.yml` for ad hoc PR preview deployments.
  - Add `deploy-staging.yml` and `deploy-production.yml` for release
    automation.

- Documentation deliverables:
  - Add a deployment runbook to `README.md` (or `docs/deployments.md`) covering:
    - GitHub:
      - required repository secrets and where they are used,
      - workflow trigger mapping (`pull_request`, `develop`, `main`),
      - required permissions for workflow tokens.
    - Deno Deploy:
      - which app corresponds to preview/staging/production lanes,
      - required environment variables per context,
      - how preview URLs are discovered from deployments.
    - Convex:
      - which deployment corresponds to preview/staging/production,
      - deploy keys required per lane and where they are stored in GitHub,
      - any preview deployment lifecycle constraints relevant to operators.
  - Include a short troubleshooting section for common failures (missing secret,
    invalid deploy key, missing `NEXT_PUBLIC_CONVEX_URL`, failed smoke checks).

- Alternatives considered:
  1) Single-environment auto deploy only: simpler setup, higher production risk.
  2) Manual production deploy with staging auto deploy: safer than fully manual,
     but still operationally inconsistent.
  3) Per-PR preview deployments with isolated Convex previews: stronger backend
     isolation, but higher backend environment complexity.
  4) No preview environment: simpler operations, but weaker pre-merge
     confidence.
  5) Deploy Deno app before Convex: increases risk of app/backend contract
     mismatch.

## Testing Decisions

- CI quality gate:
  - `deno task check` must pass before deployment jobs continue.

- Deployment verification:
  - After preview deploy: run smoke validation against the generated preview URL
    from that PR trigger.
  - After staging deploy: run smoke validation against staging app URL.
  - After production deploy: run smoke validation against production URL.
  - Documentation verification: operator can follow runbook from a clean setup
    and confirm all required GitHub, Deno Deploy, and Convex configuration
    steps without ambiguity.

- Contract confidence:
  - Ensure import submit + import status readback behavior remains green in both
    environments with environment-specific Convex URL wiring.

- Failure behavior:
  - If Convex deploy fails, Deno deploy must not run.
  - If Deno deploy fails, workflow should surface explicit failure with
    deployment step context.
  - Preview deploys may overlap; each preview URL should be tested and reported
    independently, while all previews still share the same Convex preview
    backend.

## Out of Scope

- Blue/green, canary, or percentage traffic shifting.
- Multi-region deployment strategy.
- Automated database migration orchestration beyond Convex deploy semantics.
- Cost optimization policy and scaling thresholds.
- Additional permanent environments (`dev`/`qa`) beyond preview, staging, and
  production.

## Further Notes

- This PRD defines deployment orchestration only; it does not change app feature
  behavior.
- After adoption, README should include an operator runbook section for:
  - branch-to-environment mapping,
  - required secrets,
  - rollback procedure.
- Follow-up tasks:
  - add and validate `deploy-preview.yml`,
  - add and validate `deploy-staging.yml`,
  - add and validate `deploy-production.yml` in `.github/workflows/`.
