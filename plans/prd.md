## Problem Statement

This product is primarily for personal use. I subscribe to multiple cocktail newsletters and follow
YouTube channels where interesting drinks are presented regularly. When I discover a drink I want to
try, saving it for later is inconsistent and fragmented across bookmarks, notes, and video links.

Today, the workflow has three core problems:

- Saving is ad hoc and easy to lose (browser bookmarks, screenshots, scattered notes).
- Recipes are hard to revisit in a usable format when it is time to actually mix.
- Source attribution is often lost, so it is hard to remember where a cocktail originally came from.

The core need is a reliable personal cocktail collection: quickly save interesting recipes, keep
them structured for later mixing, and always preserve original source context.

## Solution

Build a mobile-first Progressive Web App with a staged delivery plan. Start with a minimal
Next.js app running on Deno and deployable end-to-end following the Deno Next tutorial baseline.
After deployment is stable, integrate Convex for backend data/auth capabilities, then layer in
recipe import and normalization features.

Primary value proposition:

- Fast path from local setup to deployed app
- Incremental architecture: deploy first, then backend integration, then feature depth
- Personal cocktail collection foundation ready for iterative enhancement

## User Stories

1. As a home bartender, I want to paste a recipe URL and import it in one tap, so that I avoid
   manual transcription.
2. As a home bartender, I want the app to extract ingredients, quantities, and steps automatically,
   so that I can start mixing immediately.
3. As a home bartender, I want import confidence indicators when parsing is uncertain, so that I
   know what to review.
4. As a home bartender, I want low-confidence imports saved as drafts, so that I can safely review
   and fix uncertain parsing results.
5. As a home bartender, I want to browse my saved recipes as cards, so that I can quickly pick a
   drink.
6. As a home bartender, I want to search by drink name and ingredient, so that I can find what I can
   make right now.
7. As a home bartender, I want filters for spirit base, cocktail family, and difficulty, so that I
   can narrow choices quickly.
8. As a home bartender, I want recipe pages formatted for active mixing, so that measurements and
   steps are legible with wet hands and low attention.
9. As a home bartender, I want to edit any imported field, so that I can correct parsing mistakes.
10. As a home bartender, I want personal notes and substitutions, so that recipes improve over time
    based on my taste.
11. As a home bartender, I want servings and unit preferences to be adjustable, so that recipes
    match my context.
12. As a user, I want import history with status (queued, processing, complete, failed), so that I
    understand what happened after URL submission.
13. As a user, I want clear error messages and retry actions for failed imports, so that I can
    recover without support.
14. As a user, I want basic account security through authentication, so that my private recipe
    collection is protected.

## Polishing Requirements

- Recipe detail view is readable in one-handed mobile use (large tap targets, clear typography
  hierarchy, sticky key actions).
- Import status and error states are explicit, actionable, and never silently fail.
- Search and filters preserve state when navigating between list and detail.
- Ingredient names and units are normalized for consistency across recipes.
- Extracted measurements must preserve original unit values exactly as sourced (for example `fl oz`
  or `ml`) in recipe metadata.
- Recipe view must support instant unit switching between `fl oz` and `ml` without losing original
  source values.
- PWA install prompt timing avoids interrupting first-use flows.
- Empty states guide the user to paste first URL and explain supported sources.

## Tech Stack

| Layer                      | Tech                                         | Why                                                                         |
| :------------------------- | :------------------------------------------- | :-------------------------------------------------------------------------- |
| App Baseline (Phase 1)     | Deno + Next.js                               | Fastest path to a deployable app baseline using official tutorial flow      |
| Frontend UI                | TailwindCSS + shadcn/ui (PWA)                | Mobile-first UX and installable app behavior                                |
| Backend (Phase 2)          | Convex                                       | Real-time database, auth, and storage after deployment baseline is stable   |
| Import Pipeline (Phase 3)  | Deno Deploy                                  | Clean URL ingestion worker model, strong DX, `deno test`, OTel tracing      |
| Recipe Parsing (Phase 3)   | AI SDK (structured extraction)               | Provider-agnostic parsing flow with schema-constrained structured outputs   |
| Image Generation (Phase 4) | Replicate (img2img/style transfer)           | Deferred enhancement for consistent illustrated recipe art                  |

### Image Generation Flow (Phase 4, Deferred)

1. User submits source URL.
2. Import worker scrapes recipe content and discovers candidate images (`og:image`, JSON-LD image,
   or largest relevant page image).
3. Worker sends the selected image + style preset to Replicate for image-to-image transformation.
4. Styled illustration is stored with recipe metadata and shown as default recipe art.
5. If image extraction or generation fails, recipe import still succeeds with placeholder artwork
   and optional regenerate action.

## Implementation Decisions

- Product Scope and Phasing:
  - Phase 1 (MVP foundation): create a simple Next.js app on Deno and deploy it successfully.
    This phase validates runtime, build/deploy path, and baseline app shell only.
  - Phase 2: integrate Convex (schema, auth baseline, data access pattern) into the deployed app
    without introducing full import complexity yet. Default to direct Convex
    reads/writes from app code instead of proxying internal app data through
    Next API routes.
  - Phase 3: add URL import, parsing/normalization, draft-on-low-confidence, recipe browsing,
    search/filter, edit/notes, and import status tracking.
  - Phase 4: AI-generated illustrations, offline mode, stronger categorization, optional bulk
    re-import and style regeneration.

- Modules to Build or Modify:
  - Phase 1: minimal web app shell (Next.js on Deno) with successful deployment.
  - Phase 2: Convex integration module (client setup, auth baseline, initial entities).
  - Phase 3: recipe collection module (list, search, filters, detail, edit form, notes).
  - Phase 3: import submission module (URL intake, validation, queueing, status tracking).
  - Phase 3: import worker module (fetch page metadata, parse recipe via AI SDK, strict
    normalization, persistence).
  - Phase 3: observability module (distributed traces, structured logs, import outcome metrics).

- Architecture Decisions:
  - Baseline app: Next.js on Deno, following the Deno Next tutorial pattern to reduce setup risk
    and ensure deployability.
  - Frontend enhancement: TailwindCSS + shadcn/ui with mobile-first layout and PWA capabilities.
  - Backend data/auth/storage: Convex for rapid iteration and real-time updates, introduced only
    after Phase 1 deployment success.
  - Auth strategy: Convex Auth using the easiest initial setup path (anonymous-first) for v1
    single-user deployment.
  - Import worker: Deno Deploy service handling scraping and AI SDK extraction orchestration (image
    generation deferred).
  - Recipe parsing: AI SDK-driven structured extraction with strict JSON schema outputs and server-side validation.
  - Source scope for v1: allowlist of cocktail recipe sites (including Difford's Guide, Liquor.com).

- Data and Schema Decisions:
  - Core entities: User, Recipe, Ingredient, Step, Note, ImportJob, ImportEvent.
  - Recipe stores both normalized fields and source attribution metadata (source URL, source title,
    extracted image URL).
  - ImportJob retains status transitions, timestamps, errors, model/provider metadata, and retry
    count.
  - Parsing confidence model: imports below confidence threshold are saved with `draft` status and
    review-required flags.
  - Strict normalization is required in v1: canonical ingredient naming, standardized units, and
    normalized step formatting.
  - Measurement metadata is required: store original unit system per recipe (`fl_oz` or `ml`) and
    original per-ingredient quantities/units alongside normalized values.

- API and Contract Decisions:
  - Internal app data path uses Convex generated functions directly (client
    hooks and Convex Next.js server helpers). Next API routes are reserved for
    explicit external boundary concerns.
  - URL import endpoint accepts source URL and validates against configured domain allowlist for v1.
  - Import status endpoint/stream exposes job lifecycle and recoverable failure states.
  - Recipe write operations are idempotent for retries.
  - Parsing contract enforces required fields and saves low-confidence extractions as drafts for
    user review.
  - Recipe read contract must expose both original measurements and converted display measurements
    for client-side `fl oz`/`ml` switching.

- UX and Behavior Decisions:
  - Import is asynchronous; UI immediately confirms submission and shows processing state.
  - Low-confidence parse results are automatically marked draft and surfaced with explicit review
    prompts.
  - Recipe view prioritizes ingredients and steps above metadata while mixing.

- Rollout and Operations:
  - Soft launch for personal use with conservative rate limits on import.
  - No explicit cost guardrails in v1; usage monitoring only.
  - No admin mode in v1; rely on logs/metrics for operational visibility.
  - OTel tracing and structured error taxonomy required before broad rollout.

- Alternatives Considered:
  - Parser-only ingestion without LLMs: lower cost and predictability, but weaker coverage across
    unstructured recipe sources and videos.
  - Single backend platform only (no separate import worker): simpler operations, but poorer
    isolation for long-running scraping/generation jobs.
  - Text-only recipe cards without generated images: fastest delivery, but weaker visual identity
    and collection scanability.

## Testing Decisions

- Test Quality Criteria:
  - Tests must validate externally observable behavior and user outcomes.
  - Favor scenario tests around import lifecycle and recipe usability.
  - Avoid coupling tests to internal implementation details or provider-specific internals.

- Modules Requiring Automated Tests:
  - Phase 1 deployability baseline: app boots locally on Deno, builds, and deploy target health
    checks pass.
  - Phase 2 Convex baseline: client connection, auth/session bootstrap, and a minimal read/write
    flow succeed.
  - URL import flow: valid URL accepted, invalid URL rejected with actionable error.
  - Allowlist enforcement: unsupported domains rejected with clear explanation.
  - Import worker orchestration: successful parse path, recoverable provider failure path, retry
    path, terminal failure path.
  - Recipe normalization: strict ingredient/unit standardization and schema validation behavior.
  - Draft behavior: low-confidence parse stored as draft with review flags.
  - Search/filter behavior: correct recipe sets returned for key query/filter combinations.
  - Recipe editing and notes: edits persist and are reflected in subsequent reads.

- Manual Acceptance Tests:
  - End-to-end paste URL to rendered recipe on mobile viewport.
  - Import from user's own recipe website plus at least one supported external site (Difford's Guide
    or Liquor.com).
  - Low-confidence source scenario yields draft recipe requiring review.
  - App install to home screen and relaunch behavior.

- Monitoring and Quality Gates:
  - Track import success rate, parse confidence distribution, and median import completion time.
  - Release gate: import success and fallback paths meet defined reliability thresholds before
    expanding scope.

## Out of Scope

- Social sharing, comments, likes, follows, or public profiles.
- Shopping lists, pantry inventory, or procurement workflows.
- Native iOS/Android apps.
- Multi-user collaboration on shared collections.
- Monetization, subscriptions, ads, or marketplace features.
- Advanced bartender tooling (costing, menu engineering, POS integrations).
- AI-generated recipe illustrations (deferred to Phase 2).
- Offline mode (deferred to Phase 2).
- Admin dashboard or in-app operations console (deferred from v1).

## Further Notes

- Initial implementation should mirror the official Deno Next tutorial flow for project structure
  and deployment baseline: https://docs.deno.com/examples/next_tutorial/
- Current repository state is a Next.js app running on Deno at the repository root. Convex
  integration and Deno Deploy import worker are not yet implemented.
- Legal/compliance follow-up is needed for source-site terms, media reuse rights, and caching policy
  for scraped content.
- Future enhancement candidates: duplicate recipe detection, taste-profile tagging, and optional
  voice-guided mixing mode.
