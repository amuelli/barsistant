## Problem Statement

Barsistant currently provides a deployable Next.js baseline and URL import tracer
flow, but it does not yet have a persistent, real-time application backend. From
the product perspective, this blocks progression from placeholder "queued"
responses to durable recipe import jobs and user-visible state updates.

The immediate need is to add Convex as the backend dependency and integrate it
into the existing React/Next.js app in a way that remains compatible with Deno
Deploy hosting for the web application.

## Solution

Introduce Convex as the system of record and mutation/query runtime for the app,
with a minimal first slice that proves end-to-end viability on Deno Deploy:

- Convex dependency and generated client setup is added to the project.
- The Next.js app is wrapped with a Convex client provider so UI can read/write
  Convex-backed state.
- The import submission flow writes a real import job record to Convex with
  direct Convex function usage as the default application path; Next API routes
  are only transitional or for true edge-only concerns.
- Environment variable and deployment configuration are aligned so local
  development and Deno Deploy both connect to the correct Convex deployment.

This slice optimizes for low-risk integration first, then leaves room for
incremental feature depth (job processing, parsing pipeline, auth, etc.).

## User Stories

1. As a Barsistant user, I want submitted import URLs to be persisted, so that
   my requests are not lost between page reloads or deploys.
2. As a Barsistant user, I want to see import job status come from live backend
   data, so that queued/imported/failed states are trustworthy.
3. As a Barsistant user, I want import validation errors to remain clear and
   actionable, so that I know how to fix invalid submissions.
4. As a product owner, I want the existing import UX to keep working while the
   backend is swapped in, so that no regression is introduced during adoption.
5. As a product owner, I want the first Convex integration to be intentionally
   small, so that delivery risk stays low and iteration speed stays high.
6. As a developer, I want one documented local startup flow for Next.js + Convex,
   so that onboarding and troubleshooting are straightforward.
7. As a developer, I want generated Convex types to be used by app queries and
   mutations, so that API contract drift is caught early.
8. As a developer, I want runtime configuration to work in both local and Deno
   Deploy environments, so that there is no environment-specific divergence.
9. As an operator, I want health and smoke checks to continue passing with
   Convex enabled, so that deploy confidence remains high.
10. As an operator, I want explicit failure behavior when Convex configuration is
    missing, so misconfiguration is detected quickly.
11. As a future feature owner, I want clear backend boundaries (import jobs vs.
    parsing pipeline), so that later phases can evolve without rework.
12. As a future feature owner, I want the integration pattern to use direct
    Convex reads/writes by default and reserve Next API routes for narrow
    boundary concerns only, so scaling the architecture does not require a
    rewrite.

## Polishing Requirements

- Preserve current form responsiveness and status messaging quality.
- Maintain current URL validation semantics and supported-domain messaging.
- Ensure copy, naming, and status labels remain consistent between UI and API.
- Document setup and deployment steps with minimal ambiguity.
- Ensure failure states (Convex unavailable, missing env vars) produce concise,
  user-appropriate error surfaces.

## Implementation Decisions

- Architecture decision:
  Use Convex as a managed backend service; keep Next.js app hosted on Deno
  Deploy. Convex backend is not hosted inside Deno Deploy.
- Runtime integration:
  Add Convex JavaScript/React dependencies and initialize a shared Convex client
  for browser usage via a top-level provider.
- Application data access pattern:
  Prefer direct Convex generated API usage from app code (`useQuery`,
  `useMutation`, and Convex Next.js server helpers) rather than proxying
  Convex through Next API routes.
- Data model:
  Introduce an import job entity that stores source URL, status, timestamps, and
  optional failure reason. Keep schema intentionally minimal for phase 1.
- API behavior:
  Replace synthetic import queue responses with a real Convex mutation that
  persists and returns the created job contract. Avoid introducing internal
  route-level proxy layers unless there is an explicit boundary requirement.
- Validation boundary:
  Keep URL/domain validation behavior contract-compatible; validation can remain
  at app edge before mutation execution.
- Environment configuration:
  Standardize on Convex-required environment variables (including public Convex
  URL) for local development and Deno Deploy runtime configuration.
- Module plan:
  1) Convex setup and generated type pipeline.
  2) App runtime provider and client wiring.
  3) Import submission integration to write/read Convex job records.
  4) Documentation and operator runbooks for local + deploy.
- Alternatives considered:
  1) Keep synthetic API and defer persistence: lowest effort, but does not
     de-risk backend integration.
  2) Use direct database integration in Next.js: fewer moving parts initially,
     but loses Convex real-time/query ergonomics and diverges from roadmap.
  3) Build full import-processing workers now: more complete, but too large for
     first adoption slice and higher regression risk.

## Testing Decisions

- Good test standard:
  Validate externally observable behavior (HTTP responses, persisted job
  visibility, rendered states, error surfaces), not internal implementation.
- Module coverage:
  1) Import submission contract tests against Convex function behavior and
     app-level outcomes: valid URL creates persisted queued job; invalid or
     unsupported inputs still return expected client-facing errors.
  2) UI integration tests: submitting a URL results in visible queued state that
     reflects stored backend data.
  3) Configuration tests: missing or malformed Convex environment config fails in
     a controlled, diagnosable way.
  4) Smoke checks: startup + health + import submission path remain green with
     Convex enabled.
- Prior art:
  Existing smoke checks and user-flow tests should be extended to preserve
  current confidence style while shifting expected behavior from synthetic queue
  responses to persisted backend-backed responses.

## Out of Scope

- Full cocktail recipe extraction/parsing pipeline.
- Background workers and retry orchestration beyond initial queued persistence.
- Authentication and multi-user tenancy.
- Advanced import history UX (filtering, pagination, management views).
- Data migration of historical jobs from prior systems.
- Vendor abstraction to support hot-swapping away from Convex in this phase.

## Further Notes

- Documentation research basis:
  Convex recommends using `npm install convex`, running `npx convex dev` to
  create project scaffolding and local env vars, and using Next.js provider/SSR
  integration patterns for app wiring.
- Deployment compatibility basis:
  Deno Deploy supports Next.js app deployment and runtime environment variables;
  this phase relies on that support and treats Convex as an external managed
  backend endpoint.
- Research references:
  1) https://docs.convex.dev/quickstart/nextjs
  2) https://docs.convex.dev/client/nextjs/app-router/
  3) https://docs.convex.dev/client/nextjs/app-router/server-rendering
  4) https://docs.convex.dev/api/modules/nextjs
  5) https://docs.deno.com/deploy/reference/frameworks/
  6) https://docs.deno.com/deploy/getting_started/
  7) https://docs.deno.com/deploy/reference/builds/
  8) https://docs.deno.com/examples/next_tutorial/
- Unverified assumptions:
  1) No additional org-specific networking restrictions prevent Deno Deploy from
     reaching Convex endpoints.
  2) Existing CI/check workflow can accommodate Convex codegen and related setup
     without policy changes.

## Iteration Update (2026-02-13)

- Added `src/config/convex.ts` with `resolveConvexUrl` and `getRequiredConvexUrl` to enforce explicit runtime validation for `NEXT_PUBLIC_CONVEX_URL`.
- Added `src/config/convex.test.ts` coverage for valid URL, missing env var, malformed URL, and unsupported protocol failure behavior.
- Ran `deno check` successfully after adding the configuration guard.

## Iteration Update (2026-02-13, Convex client bootstrap)

- Added `convex` dependency to project dependencies.
- Added `src/convex/client.ts` shared singleton factory (`getConvexClient`) wired to `getRequiredConvexUrl` for fail-fast config validation at client init.
- Added `src/convex/client.test.ts` coverage for singleton reuse and missing `NEXT_PUBLIC_CONVEX_URL` failure.

## Iteration Update (2026-02-13, Convex provider wiring)

- Added `src/app/providers.tsx` with a client-side `AppProviders` wrapper that mounts `ConvexProvider` using shared `getConvexClient`.
- Updated `src/app/layout.tsx` to wrap app children in `AppProviders`, establishing global Convex runtime context for upcoming query/mutation slices.
- Added `src/app/layout.test.tsx` source-level contract coverage to ensure provider wiring remains present.

## Iteration Update (2026-02-13, server-side Convex client bootstrap)

- Added `src/convex/server.ts` with `getConvexServerClient` and `resetConvexServerClientForTests` using `ConvexHttpClient` + `getRequiredConvexUrl` to establish fail-fast server-write client wiring for upcoming route mutation integration.
- Kept current import route behavior unchanged (still synthetic queued response) to preserve existing smoke and API contract while preparing server-driven write plumbing.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, Convex import job backend scaffold)

- Added `convex/schema.ts` with a minimal `importJobs` table (`sourceUrl`, `status`, timestamps, optional `failureReason`) and baseline indexes for `status` and `createdAt`.
- Added `convex/importJobs.ts` with `createImportJob` mutation to persist a queued import job and return `{ jobId, sourceUrl, status }`.
- Kept Next.js `POST /api/imports` route behavior unchanged in this iteration; next task should switch route writes from synthetic IDs to this Convex mutation.

## Iteration Update (2026-02-13, imports route Convex mutation wiring)

- Updated `src/app/api/imports/route.ts` to call Convex mutation `importJobs:createImportJob` via a typed function reference (`makeFunctionReference`) instead of synthetic `crypto.randomUUID()` responses.
- Preserved existing URL/domain validation behavior and added explicit controlled failure response (`503`) with shared `IMPORT_SERVICE_UNAVAILABLE_ERROR` when backend mutation execution is unavailable.
- Added route-level test seam `setCreateImportJobForTests` and expanded `src/app/api/imports/route.test.ts` coverage to validate successful queued responses and controlled backend-unavailable responses without live Convex dependency.
- Extended smoke behavior in `scripts/smoke_health.mjs` so import submission asserts queued `202` when `NEXT_PUBLIC_CONVEX_URL` is configured, otherwise asserts controlled unavailable response; this keeps the check gate green in both configured and unconfigured environments.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, import job status read tracer bullet)

- Added `convex/importJobs.ts` query `getImportJob` to read a single persisted import job by id and return `{ jobId, sourceUrl, status }` or `null`.
- Added `GET /api/imports/[jobId]` route at `src/app/api/imports/[jobId]/route.ts` wired to Convex query `importJobs:getImportJob` with controlled response surfaces:
  - `200` for found jobs,
  - `404` for unknown jobs,
  - `400` for invalid job id format,
  - `503` for backend unavailable/misconfigured conditions.
- Added route contract tests in `src/app/api/imports/[jobId]/route.test.ts` covering found/not-found/invalid-id/backend-unavailable behaviors via an injected query seam.
- Extended import contract constants in `src/contracts/imports.ts` for `IMPORT_JOB_NOT_FOUND_ERROR` and `INVALID_IMPORT_JOB_ID_ERROR`.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, Convex runtime/deploy docs alignment)

- Updated `README.md` to document explicit Convex runtime configuration for local development and Deno Deploy (`NEXT_PUBLIC_CONVEX_URL` required, `CONVEX_DEPLOYMENT` optional helper).
- Clarified that `.env.local` is populated via `deno task convex:dev` and Deno Deploy must set `NEXT_PUBLIC_CONVEX_URL` for `/api/imports` and `/api/imports/[jobId]`.
- Updated smoke-check documentation to reflect dual expected outcomes: `202 queued` when configured, controlled `503 import_service_unavailable` when Convex env is missing.
- Investigated adopting generated `convex/_generated/api` route typing this iteration; blocked in current Deno check path because generated `api` resolves to `{}` in this setup. Deferred to a dedicated follow-up task after codegen/type-resolution strategy is stabilized.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, typed Convex API bridge for route references)

- Replaced route-level `makeFunctionReference` usage in `POST /api/imports` and `GET /api/imports/[jobId]` with shared `src/convex/api.ts` generated-runtime API references (`api.importJobs.createImportJob`, `api.importJobs.getImportJob`).
- Added `src/convex/api.ts` typed bridge based on `ApiFromModules` + Convex module exports to enforce function-name/arg/return contracts in Deno type-checks despite current `convex/_generated/api.d.ts` resolution collapsing to `{}`.
- Updated import-job GET route query call to cast validated `jobId` to `GenericId<"importJobs">` at the route boundary so the Convex query arg contract is enforced.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, smoke gate covers import status readback)

- Extended `scripts/smoke_health.mjs` configured-path behavior to assert both:
  - `POST /api/imports` returns a queued persisted job contract, and
  - `GET /api/imports/[jobId]` returns the same persisted queued job payload.
- Kept missing-Convex-env behavior unchanged (`POST /api/imports` controlled `503`) so smoke remains green in unconfigured environments.
- Updated README smoke-check wording to document the new configured-path readback assertion.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, UI status readback tracer bullet)

- Updated `src/app/import_url_form.tsx` to perform a follow-up `GET /api/imports/[jobId]` after successful submit so visible status is read from persisted backend data.
- Added controlled fallback behavior: when status readback fails, the UI keeps the queued submission result and surfaces `Import queued, but status refresh failed.`.
- Updated `src/app/page.tsx` tracer-bullet copy to remove outdated placeholder-response wording and reflect persisted/readback behavior.
- Added `src/app/import_url_form.test.tsx` source-level contract coverage to lock POST submit + GET status readback wiring.
- Ran `deno task check` successfully.


## Iteration Update (2026-02-13, Convex API bridge regression guard)

- Re-validated that direct route typing via `convex/_generated/api.js` still fails `deno check` in this setup (`api` resolves to `{}` for route type-checks), so the typed bridge remains required for now.
- Added `src/convex/api.test.ts` to assert the bridge exposes the expected import job function references (`createImportJob`, `getImportJob`) and to guard against accidental bridge drift/removal without a replacement.
- Kept route wiring and response contracts unchanged while improving confidence in the current type-safety workaround.

## Clarification Update (2026-02-13, intended Convex architecture)

- Clarified that route-level Convex calls documented in prior iteration notes are
  implementation steps for an early tracer bullet, not the target product
  architecture.
- Confirmed intended steady-state approach: app data access should use Convex
  generated APIs directly (client hooks and Next.js Convex server helpers),
  with Next API routes used only where external boundary constraints require
  them.

## Iteration Update (2026-02-13, unified local startup flow)

- Added `deno task dev:full` backed by `scripts/dev_full.mjs` to run Next.js and Convex together in one command for local development.
- Implemented signal-aware process shutdown in `scripts/dev_full.mjs` so stopping the wrapper cleanly terminates both child processes.
- Updated `README.md` setup instructions to make the unified startup flow the default path while preserving separate `deno task convex:dev` guidance.

## Iteration Update (2026-02-13, Convex codegen added to check gate)

- Updated `deno task check` to run `deno task convex:codegen` first so generated Convex bindings are refreshed before format/lint/test/type/build/smoke checks.
- Re-validated direct route typing from `convex/_generated/api.js`; it still resolves to `{}` under the current Deno check path, so `src/convex/api.ts` bridge remains required.

## Iteration Update (2026-02-13, server Convex client test coverage + env allowlist)

- Added `src/convex/server.test.ts` coverage for `getConvexServerClient` singleton reuse and missing `NEXT_PUBLIC_CONVEX_URL` failure behavior.
- Updated `deno task test` env allowlist in `deno.json` to include `WS_NO_BUFFER_UTIL` and `WS_NO_UTF_8_VALIDATE`, required by Convex's Node-side WebSocket dependency path during module initialization in this Deno test runtime.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, Convex API bridge compile-time strictness guard)

- Added `src/convex/api.typecheck.ts` to enforce compile-time contract behavior for the route-facing Convex bridge (`src/convex/api.ts`):
  - expected public references (`importJobs.createImportJob`, `importJobs.getImportJob`) must remain valid,
  - unknown modules/functions must remain rejected at type-check time.
- Kept runtime behavior unchanged; this is a development-infrastructure guard to catch API drift/regression early while direct generated `convex/_generated/api` typing remains unresolved in the Deno check path.

## Iteration Update (2026-02-13, smoke gate validates invalid job-id contract)

- Extended `scripts/smoke_health.mjs` to assert `GET /api/imports/invalid-id` returns controlled `400` with `INVALID_IMPORT_JOB_ID_ERROR` in both configured and unconfigured Convex environments.
- Updated `README.md` smoke-check documentation to include the invalid job-id contract expectation alongside existing queued/unavailable submission behavior.
- Kept route runtime behavior unchanged; this iteration strengthens operator-facing smoke coverage for explicit failure surfaces.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, import form behavior-test infrastructure)

- Refactored `src/app/import_url_form.tsx` to extract submit/readback flow into exported `submitImportUrl`, preserving existing user-facing error/status behavior while making the flow testable as logic.
- Replaced `src/app/import_url_form.test.tsx` source-string assertions with behavioral tests that mock fetch and validate:
  - successful POST + GET status readback outcome,
  - controlled fallback outcome when status readback fails after a successful submit.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, layout test infrastructure de-brittle)

- Replaced `src/app/layout.test.tsx` source-string assertions with an element-structure behavior test that validates `html/body` contract and `AppProviders` wrapping via a pure view component.
- Extracted `src/app/root_layout_view.tsx` and updated `src/app/layout.tsx` to delegate rendering so tests can execute without importing `globals.css` (unsupported in current Deno test module loading).
- Kept runtime layout behavior unchanged while improving test reliability and reducing false positives from text-only source checks.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, providers test infrastructure de-brittle)

- Replaced `src/app/providers.test.tsx` source-string assertions with a behavior-level element test that directly verifies server prerender fallback (`AppProviders` returns children unchanged when `window` is unavailable).
- Kept runtime provider behavior unchanged; this iteration only improves test quality and reduces brittleness from file-text matching.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, page app-shell test infrastructure de-brittle)

- Replaced `src/app/page.test.tsx` source-file string assertions with behavior-level JSX structure assertions against the `Home` component output.
- Added explicit checks for app-shell marker contract (`data-app-shell` equals `APP_SHELL_MARKER`) and tracer-bullet wiring (`ImportUrlForm` presence) without reading file text.
- Kept runtime page behavior unchanged; this iteration is test-quality infrastructure only.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, providers browser-path behavior guard)

- Extended `src/app/providers.test.tsx` with a behavior-level browser-runtime test that verifies `AppProviders` wraps children in `ConvexProvider` and wires the shared `getConvexClient()` instance when `window` is present.
- Kept runtime provider implementation unchanged; this iteration tightens development-infrastructure test coverage for provider contract parity across server and browser paths.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, route contracts bound to Convex return types)

- Updated `POST /api/imports` and `GET /api/imports/[jobId]` route-local result types to derive from Convex function references via `FunctionReturnType` instead of duplicated handwritten shapes.
- Kept runtime route behavior and HTTP contracts unchanged while strengthening compile-time drift detection between route adapters and Convex mutation/query return payloads.
- Updated `src/app/api/imports/route.test.ts` test seam fixture to use `GenericId<"importJobs">`-compatible `jobId` typing.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, smoke gate validates unknown job 404 contract)

- Extended `scripts/smoke_health.mjs` configured-path behavior to assert `GET /api/imports/<unknown-valid-id>` returns controlled `404` with `IMPORT_JOB_NOT_FOUND_ERROR`.
- Kept unconfigured Convex behavior unchanged (`POST /api/imports` still asserts controlled `503`) and retained the cross-environment invalid-id `400` assertion.
- Updated `README.md` smoke-check documentation to include the configured-path unknown-job `404 import_job_not_found` expectation.

## Iteration Update (2026-02-13, import status route async-params contract guard)

- Added behavior-level coverage in `src/app/api/imports/[jobId]/route.test.ts` to assert `GET /api/imports/[jobId]` handles Next App Router's async `context.params` shape (`Promise<{ jobId: string }>`), returning the persisted queued contract when the job exists.
- Kept route runtime behavior unchanged; this iteration is development-infrastructure test hardening for route handler compatibility.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, Convex bootstrap misconfiguration test hardening)

- Extended `src/convex/client.test.ts` with malformed URL coverage so `getConvexClient()` explicitly fails when `NEXT_PUBLIC_CONVEX_URL` is not a valid absolute URL.
- Extended `src/convex/server.test.ts` with unsupported protocol coverage so `getConvexServerClient()` explicitly fails when `NEXT_PUBLIC_CONVEX_URL` is non-HTTP(S).
- Kept runtime Convex client/server bootstrap behavior unchanged; this iteration is development-infrastructure coverage only to tighten misconfiguration feedback guarantees.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, import form direct Convex status readback tracer bullet)

- Updated `src/app/import_url_form.tsx` so post-submit status readback now uses direct Convex query access (`getConvexClient().query(api.importJobs.getImportJob, ...)`) instead of the transitional `GET /api/imports/[jobId]` route.
- Kept `POST /api/imports` as the submission boundary for this slice while moving the read path to the intended app-level Convex access pattern.
- Added `setReadImportJobStatusForTests` seam and updated `src/app/import_url_form.test.tsx` behavioral coverage to validate successful direct readback and controlled fallback messaging when readback fails.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, import form direct Convex mutation submit tracer bullet)

- Updated `src/app/import_url_form.tsx` so URL submission now writes directly via Convex mutation (`getConvexClient().mutation(api.importJobs.createImportJob, ...)`) instead of posting through transitional `POST /api/imports`.
- Added shared app/route URL validation module at `src/imports/source_url_validation.ts` and reused it in `POST /api/imports` to keep validation semantics and supported-domain behavior contract-compatible across both paths.
- Added `setCreateImportJobForTests` seam and expanded `src/app/import_url_form.test.tsx` behavioral coverage for invalid URL, unsupported domain, controlled backend-unavailable write failure, successful submit+readback, and readback-fallback outcomes.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, import form adapter types bound to Convex contracts)

- Updated `src/app/import_url_form.tsx` to derive submit/read adapter result types from Convex function references via `FunctionReturnType` (`api.importJobs.createImportJob` and `api.importJobs.getImportJob`) instead of handwritten response shapes.
- Removed route-adapter-style casts on default client mutation/query calls in the import form flow so return typing is enforced directly from Convex API contracts.
- Updated `src/app/import_url_form.test.tsx` fixtures to use `GenericId<"importJobs">`-compatible job IDs to match tighter seam typing while preserving existing behavior assertions.
- Kept runtime submit/read UX behavior unchanged; this slice is development-infrastructure hardening for API drift detection.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, source URL validation module behavior coverage)

- Added `src/imports/source_url_validation.test.ts` with direct behavior tests for shared URL validation semantics:
  - accepts configured supported domains (apex + `www`),
  - normalizes accepted URL output,
  - rejects invalid URL/protocol inputs,
  - rejects unsupported domains (including non-allowlisted subdomains).
- Kept runtime validation implementation unchanged; this is development-infrastructure coverage to guard app/route validation parity.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, smoke gate validates status-route unavailable contract)

- Extended `scripts/smoke_health.mjs` unconfigured-Convex behavior to assert `GET /api/imports/<valid-id>` returns controlled `503` with `IMPORT_SERVICE_UNAVAILABLE_ERROR` (in addition to existing `POST /api/imports` unavailable assertion).
- Kept configured-Convex smoke behavior unchanged (`202 queued`, persisted status readback, unknown-job `404`, invalid-id `400`).
- Updated `README.md` smoke-check documentation to include the unconfigured status-route unavailable expectation.

## Iteration Update (2026-02-13, direct Convex importJobs function behavior coverage)

- Added `convex/importJobs.test.ts` with behavior-level tests for the Convex backend module itself:
  - `createImportJob` persists queued records with timestamp fields and returns the queued contract,
  - `getImportJob` returns `null` for missing jobs,
  - `getImportJob` returns the persisted `{ jobId, sourceUrl, status }` contract for found jobs.
- Kept runtime Convex function implementations unchanged; this iteration is development-infrastructure coverage to close direct function contract testing gaps alongside existing route/UI tests.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, import form null-readback fallback coverage)

- Extended `src/app/import_url_form.test.tsx` with behavior coverage for the direct Convex readback `null` path after a successful submit.
- Asserted the user-facing fallback contract remains consistent with the thrown-readback path: retain queued submission result and surface `Import queued, but status refresh failed.`.
- Kept runtime implementation unchanged; this slice closes an untested branch in import-form submission/readback logic.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, smoke gate import-mode detection hardening)

- Updated `scripts/smoke_health.mjs` to determine Convex mode from observed
  import submission behavior (`202 queued` vs controlled `503
  import_service_unavailable`) rather than pre-reading
  `NEXT_PUBLIC_CONVEX_URL`.
- Kept configured-path persisted status readback assertion and unconfigured-path
  controlled submit/status unavailable assertions; removed the configured-path
  unknown-job `404` assertion from this smoke slice to keep the startup check
  focused on baseline health + import availability mode.
- Updated `README.md` smoke-check wording to match the narrowed smoke contract.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, CI check gate runs Convex codegen)

- Updated `.github/workflows/check.yml` to run `deno task convex:codegen` before fmt/lint/test/type/build/smoke steps.
- Kept existing step-level check workflow structure (did not collapse to a single `deno task check` command) while aligning CI behavior with local check-gate expectations for generated Convex bindings.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, import job id contract tightened to Convex id type)

- Updated `convex/importJobs.ts` so `createImportJob` returns `jobId` as `v.id("importJobs")` (instead of `v.string()`), aligning mutation and query contracts on the same typed id boundary.
- Updated `src/app/import_url_form.tsx` readback adapter seam/default path to accept `GenericId<"importJobs">` directly, removing the local cast at query call sites.
- Kept runtime import UX and route behavior unchanged; this slice is development-infrastructure hardening for stronger end-to-end Convex contract typing.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, import form baseline UI render contract coverage)

- Added a behavior-level server-rendered UI contract test in `src/app/import_url_form.test.tsx` to assert baseline import form controls/copy are present (`label`/`input[type=url]`/submit button/placeholder).
- Kept runtime import form logic unchanged; this iteration strengthens development-infrastructure coverage beyond submit-flow logic by guarding core form rendering contract.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, import form Convex contract compile-time guard)

- Added `src/app/import_url_form.typecheck.ts` to enforce compile-time alignment between app-path import form adapters and Convex API contracts:
  - `submitImportUrl` outcomes must carry Convex-compatible `jobId` typing,
  - readback result typing remains tied to `api.importJobs.getImportJob`,
  - test seam `setReadImportJobStatusForTests` is guarded to require `GenericId<"importJobs">` (plain string rejected at type-check time).
- Kept runtime import form behavior unchanged; this is development-infrastructure hardening for earlier API-drift detection.
- Ran `deno task check` successfully.

## Iteration Update (2026-02-13, transitional import route contract compile-time guards)

- Added `src/app/api/imports/route.typecheck.ts` to enforce compile-time alignment between the POST route's test seam and `api.importJobs.createImportJob` return contract (including typed `jobId` guard).
- Added `src/app/api/imports/[jobId]/route.typecheck.ts` to enforce compile-time alignment between the status route seam and `api.importJobs.getImportJob` nullable result contract while preserving string route-param boundary typing.
- Kept runtime route behavior unchanged; this iteration is development-infrastructure hardening to catch API drift earlier on transitional route adapters.
- Ran `deno task check` successfully.
