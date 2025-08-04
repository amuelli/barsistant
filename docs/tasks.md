# Barsistant Implementation Tasks

## Recent Updates (August 2025)

### Recently Completed (August 2025):

- **GitHub MCP Integration**: Added MCP configuration for enhanced GitHub
  integration with Claude Code
- **AI Token Limit Handling**: Implemented proper token limit handling for
  recipe extraction
- **CLS Elimination**: Fixed Cumulative Layout Shift issues in RecipeImage
  component
- **Zod 4 Upgrade**: Updated to Zod 4 with comprehensive type system refactoring
- **Environment Loading**: Improved .env file conditional loading for
  development
- **AI SDK Updates**: Enhanced recipe extraction schema and dependency updates
- **Error Logging**: Improved Claude settings and error logging capabilities

### Major Refactoring Completed (July 2025):

- **ULID-based Recipe Storage**: Implemented chronological ordering with ULID
  keys
  - 90%+ performance improvement (200-500ms → 10-50ms)
  - Separate namespaces for user and public recipes
  - Simplified data structure with single Recipe type
- **Simplified Favorites System**: Replaced complex collections with recipe
  copying
  - "Add to My Recipes" functionality via copyRecipe
  - Removed userCollectionModel entirely
- **Authentication Optimization**: Improved middleware performance
  - Removed unnecessary session tracking operations
  - Reduced KV operations from 4-6 to 1-2 per request
- **Type Safety**: Comprehensive KV key type definitions
- **Migration System**: Complete database migration framework

### Features Removed/Simplified:

- User collections replaced with simple recipe copying
- Benchmark scripts removed
- Complex search methods replaced with in-memory filtering

## Database Setup and Implementation Tasks

This document outlines the tasks required to implement Deno KV as the database
solution for the Barsistant application.

| Status | Task ID | Description                                  | Complexity | Dependencies |
| ------ | ------- | -------------------------------------------- | ---------- | ------------ |
| ✅     | DB-1    | Create database utility module for Deno KV   | Low        | None         |
| ✅     | DB-2    | Define core data types and interfaces        | Medium     | None         |
| ✅     | DB-3    | Implement recipe model with CRUD operations  | Medium     | DB-1, DB-2   |
| ✅     | DB-4    | Implement ingredient model with CRUD         | Medium     | DB-1, DB-2   |
|        | DB-5    | Create data initialization script            | Low        | DB-3, DB-4   |
|        | DB-6    | Implement filtering by available ingredients | High       | DB-3         |
| ✅     | DB-7    | Set up user favorites (via recipe copying)   | Medium     | DB-3, USER-1 |
| ✅     | DB-8    | Implement recipe sorting (ULID-based)        | Low        | DB-3         |

## AI Recipe Extraction Tasks

| Status | Task ID | Description                                                     | Complexity | Dependencies |
| ------ | ------- | --------------------------------------------------------------- | ---------- | ------------ |
| ✅     | AI-1    | Set up provider-agnostic AI SDK integration                     | Medium     | None         |
| ✅     | AI-2    | Create URL content fetching module                              | Medium     | None         |
| ✅     | AI-3    | Implement HTML text content extraction                          | Medium     | AI-2         |
| ✅     | AI-4    | Develop recipe extraction prompt engineering                    | High       | AI-1         |
| ✅     | AI-5    | Create structured data parser for AI outputs                    | Medium     | AI-4         |
| ✅     | AI-6    | Implement recipe verification interface                         | Medium     | AI-5, UI-3   |
| ✅     | AI-7    | Implement recipe extraction handler                             | Medium     | AI-5, DB-3   |
|        | AI-8    | Add feedback mechanism for extraction quality                   | Medium     | AI-5, AI-6   |
| ✅     | AI-9    | Implement extraction evaluation system                          | Medium     | AI-4, AI-5   |
|        | AI-10   | Add YouTube content extraction support                          | High       | AI-2, AI-4   |
|        | AI-11   | Add recipe website extraction support                           | High       | AI-2, AI-4   |
| ✅     | AI-12   | Develop extraction error handling (including token limits)      | Medium     | AI-5, AI-7   |
|        | AI-13   | Create content sanitization for recipes                         | Medium     | AI-5         |
| ✅     | AI-14   | Implement AI cocktail image generation                          | High       | AI-1, DB-3   |
| ✅     | AI-15   | Adapt AI extraction to retrieve cocktail image URL from website | Medium     | AI-7, AI-11  |
| ✅     | AI-16   | AI-generated cocktail images for recipes                        | High       | AI-14, DB-3  |
| ✅     | AI-17   | S3 storage for generated cocktail images                        | Medium     | AI-14, AI-16 |
| ✅     | AI-18   | Make image generation non-blocking for recipe creation          | Medium     | AI-14, AI-16 |
| ✅     | AI-19   | Integrate recraft.ai for vector (SVG) cocktail image generation | High       | AI-14, AI-17 |

### AI-17 Implementation Details (S3 Storage)

- Use a utility in `utils/` (e.g., `utils/s3.ts`) for S3 upload logic
- Prefer [`s3-lite-client`](https://github.com/bradenmacdonald/s3-lite-client)
  for S3 integration (or [`@hk/s3`](https://jsr.io/@hk/s3) / AWS SDK v3 via JSR
  if needed)
- Use environment variables for S3 credentials and bucket info
- Accept image (Buffer or URL) from AI generation step
- Upload image to S3 and get the public URL
- Store the S3 image URL in the recipe record (Deno KV)
- Add error handling for upload failures
- Write unit tests for the S3 utility
- Document S3 config in README if not already present

---

### AI-18 Implementation Details (Non-blocking Image Generation)

- **Decouple image generation from recipe creation API:**
  - On recipe creation, immediately store recipe data in Deno KV (without
    waiting for image).
  - Enqueue an image generation job using
    `kv.enqueue({ type: "generate_recipe_raster_image", recipeId })` after
    recipe is saved.
  - Optionally, use a KV atomic transaction to ensure recipe and job are created
    together.

- **Background image generation with Deno KV Queues:**
  - Implement a `kv.listenQueue` handler to process
    `generate_recipe_raster_image` jobs.
  - Handler should:
    1. Fetch recipe data by `recipeId`.
    2. Generate image using AI provider.
    3. Upload image to S3 (via `utils/s3.ts`).
    4. Update recipe record in KV with new image URL.
    5. Log success or failure.
  - Ensure handler is idempotent (safe to run more than once for same recipe).

- **Error handling & retries:**
  - If image generation or upload fails, throw in handler to trigger automatic
    retry (Deno queues guarantee at-least-once delivery, with max retries).
  - For persistent failures, log error and optionally store failed job in a
    backup KV key (see `keysIfUndelivered`).
  - Add structured logging for all background job steps and errors.

- **UI/UX considerations:**
  - Ensure UI can display recipes without images (show placeholder or loading
    state).
  - When image becomes available, update UI (e.g., via polling, signals, or
    subscription).

- **Testing & monitoring:**
  - Write unit tests for enqueue logic, queue handler, and S3 upload.
  - Test non-blocking recipe creation and background update flow.
  - Add monitoring/logging for queue handler activity and failures.

- **References:**
  - See
    [Deno Queues docs](https://docs.deno.com/deploy/kv/manual/queue_overview/)
    and [blog post](https://deno.com/blog/queues) for usage patterns and best
    practices.
  - Example enqueue:
    `await kv.enqueue({ type: "generate_recipe_raster_image", recipeId })`
  - Example handler: `kv.listenQueue(async (msg) => { ... })`

### AI-19 Implementation Details (Recraft.ai Vector Images)

- Add utility in `utils/ai/` (e.g., `utils/ai/recraft.ts`) for recraft.ai API
  calls
- Add another function to generate SVG images in `utils/ai/image-generation.ts`
- Accept recipe data, generate SVG via recraft.ai, upload to S3, store URL in
  recipe record
- Update background job handler to support vector image generation
- Ensure UI can display SVGs and fallback to raster images if needed
- Add error handling, retries, and logging
- Write unit tests for recraft utility and handler
- Document recraft.ai config in README

### DEPLOY-4 Implementation Details ✅ COMPLETED

The migration system has been successfully implemented in `utils/db/migrations/`
with:

- Migration tracking in Deno KV with `["db_meta", "migrations", migrationName]`
  keys
- Automatic discovery and execution of pending migrations on startup
- Migration runner that executes migrations in chronological order
- Template generator for new migrations (`_template.ts`)
- Comprehensive unit tests for the migration system
- Support for up/down migrations with proper error handling
- Logging for all migration activities

## User Interface Tasks

| Status | Task ID | Description                              | Complexity | Dependencies     |
| ------ | ------- | ---------------------------------------- | ---------- | ---------------- |
| ✅     | UI-1    | Set up Tailwind CSS and daisyUI          | Low        | None             |
| ✅     | UI-2    | Create responsive layout templates       | Medium     | UI-1             |
| ✅     | UI-3    | Implement recipe display component       | Medium     | UI-1             |
|        | UI-4    | Create recipe search and filter UI       | Medium     | UI-1, DB-7       |
|        | UI-5    | Develop recipe submission form           | Medium     | UI-1, DB-3       |
| ✅     | UI-6    | Implement recipe extraction form         | High       | AI-5, AI-6, UI-1 |
| ✅     | UI-7    | Create account management interface      | Medium     | UI-1, USER-1     |
|        | UI-8    | Develop recipe categories browser        | Medium     | UI-1, DB-3       |
|        | UI-9    | Create ingredient browsing interface     | Medium     | UI-1, DB-4       |
|        | UI-10   | Implement measurements adjustment UI     | Medium     | UI-3             |
|        | UI-11   | Create user favorites interface          | Medium     | UI-1, DB-7       |
|        | UI-12   | Implement accessibility features (WCAG)  | High       | UI-3, UI-4, UI-5 |
|        | UI-13   | Add dark mode support                    | Low        | UI-1             |
| ✅     | UI-14   | Develop responsive mobile navigation     | Medium     | UI-1, UI-2       |
| ✅     | UI-15   | Improve extraction loading feedback      | Low        | UI-1, AI-7       |
| ✅     | UI-16   | Fix Cumulative Layout Shift (CLS) issues | Medium     | UI-3             |

## User Management Tasks

| Status | Task ID | Description                                 | Complexity | Dependencies         |
| ------ | ------- | ------------------------------------------- | ---------- | -------------------- |
| ✅     | USER-1  | Implement magic link authentication         | Medium     | DB-1                 |
| ✅     | USER-2  | Create user profile model and storage       | Medium     | DB-1, USER-1         |
| ✅     | USER-3  | Implement user preferences storage          | Medium     | USER-2               |
| ✅     | USER-4  | Create session management with Deno KV      | Medium     | USER-1               |
| ✅     | USER-5  | Implement authentication middleware         | Medium     | USER-1, USER-4       |
| ✅     | USER-6  | Create login and email verification UI      | Medium     | UI-1, USER-1         |
| ✅     | USER-7  | Set up email sending service                | Medium     | None                 |
| ✅     | USER-8  | Implement session expiration and renewal    | Low        | USER-4               |
| ✅     | USER-9  | Add rate limiting for auth requests         | Low        | USER-1               |
| ✅     | USER-10 | Create user profile settings UI             | Medium     | UI-7, USER-2         |
| ✅     | USER-11 | Implement admin mode with recipe management | Medium     | USER-1, USER-2, DB-3 |
|        | USER-13 | Create recipe notes functionality           | Medium     | USER-2, DB-3         |

## Inventory Management Tasks

| Status | Task ID | Description                              | Complexity | Dependencies  |
| ------ | ------- | ---------------------------------------- | ---------- | ------------- |
|        | INV-1   | Create inventory data model              | Medium     | DB-1, DB-2    |
|        | INV-2   | Implement user inventory management      | Medium     | INV-1, USER-2 |
|        | INV-3   | Develop inventory tracking UI            | Medium     | UI-1, INV-1   |
|        | INV-4   | Create recipe suggestions from inventory | High       | INV-1, DB-6   |
|        | INV-5   | Implement low stock notifications        | Medium     | INV-2         |
|        | INV-6   | Add inventory categorization             | Low        | INV-1         |
|        | INV-7   | Create shopping list generation          | Medium     | INV-2, DB-3   |
|        | INV-8   | Implement inventory history tracking     | Medium     | INV-2         |

## Performance Tasks

| Status | Task ID | Description                              | Complexity | Dependencies |
| ------ | ------- | ---------------------------------------- | ---------- | ------------ |
|        | PERF-1  | Implement asset optimization for images  | Medium     | None         |
|        | PERF-2  | Add caching for frequent queries         | Medium     | DB-1         |
|        | PERF-3  | Optimize recipe search query performance | High       | DB-6         |
|        | PERF-5  | Add health check endpoints               | Low        | None         |
|        | PERF-6  | Create load testing suite                | Medium     | AI-7         |

## Progressive Web App Tasks

| Status | Task ID | Description                                  | Complexity | Dependencies |
| ------ | ------- | -------------------------------------------- | ---------- | ------------ |
|        | PWA-1   | Create manifest.json for app configuration   | Low        | None         |
|        | PWA-2   | Add app icons in various sizes               | Low        | None         |
|        | PWA-3   | Implement service worker for offline support | Medium     | None         |
|        | PWA-4   | Implement installable app experience         | Medium     | PWA-1, PWA-2 |
|        | PWA-5   | Configure offline recipe viewing capability  | Medium     | PWA-3, DB-3  |

## Development Tools Tasks

| Status | Task ID | Description                                      | Complexity | Dependencies |
| ------ | ------- | ------------------------------------------------ | ---------- | ------------ |
| ✅     | DEV-1   | Configure GitHub MCP for Claude Code integration | Low        | None         |
|        | DEV-2   | Set up additional MCP servers if needed          | Low        | DEV-1        |
|        | DEV-3   | Configure development environment automation     | Medium     | None         |

## Deployment Tasks

| Status | Task ID   | Description                               | Complexity | Dependencies     |
| ------ | --------- | ----------------------------------------- | ---------- | ---------------- |
| ✅     | DEPLOY-1  | Set up Deno Deploy configuration          | Low        | None             |
| ✅     | DEPLOY-2  | Configure Deno Deploy for production      | Low        | DEPLOY-1         |
| ✅     | DEPLOY-3  | Set up GitHub Actions for deployments     | Medium     | DEPLOY-1         |
| ✅     | DEPLOY-4  | Implement automatic database migrations   | Medium     | DB-1             |
|        | DEPLOY-5  | Implement feature flag system             | Medium     | None             |
|        | DEPLOY-6  | Configure app monitoring with Deno Deploy | Low        | DEPLOY-2         |
|        | DEPLOY-7  | Set up error tracking and alerting        | Medium     | DEPLOY-6         |
|        | DEPLOY-8  | Implement logging and monitoring          | Medium     | DEPLOY-6         |
|        | DEPLOY-9  | Create database backup strategy           | Medium     | DB-1             |
|        | DEPLOY-10 | Create automated deployment tests         | Medium     | DEPLOY-3, TEST-6 |
|        | DEPLOY-11 | Implement rollback procedures             | Medium     | DEPLOY-3         |
|        | DEPLOY-12 | Set up performance monitoring dashboards  | Medium     | DEPLOY-6         |
|        | DEPLOY-13 | Configure custom domain and SSL           | Low        | DEPLOY-2         |
|        | DEPLOY-14 | Implement security headers and practices  | Medium     | DEPLOY-2         |
|        | DEPLOY-16 | Create deployment documentation           | Low        | All DEPLOY tasks |

## Testing Tasks

| Status | Task ID | Description                           | Complexity | Dependencies             |
| ------ | ------- | ------------------------------------- | ---------- | ------------------------ |
| ✅     | TEST-1  | Set up testing framework with Deno    | Low        | None                     |
| ✅     | TEST-2  | Create unit tests for database models | Medium     | DB-3, DB-4, TEST-1       |
| ✅     | TEST-2a | Create unit tests for recipe helper   | Medium     | DB-3, DB-4, TEST-1       |
|        | TEST-3  | Implement UI component tests          | Medium     | UI-3, UI-4, UI-5, TEST-1 |
| ✅     | TEST-5  | Implement AI extraction tests         | Medium     | AI-5, TEST-1             |
|        | TEST-6  | Add integration tests for user flows  | High       | TEST-1, TEST-2, TEST-3   |
|        | TEST-7  | Create accessibility testing suite    | Medium     | UI-12, TEST-1            |
|        | TEST-8  | Implement performance benchmarks      | Medium     | PERF-3, TEST-1           |
|        | TEST-9  | Create security testing suite         | High       | USER-1, AI-7, TEST-1     |

## New Tasks to Add (Post-Refactoring)

| Status | Task ID | Description                              | Complexity | Dependencies |
| ------ | ------- | ---------------------------------------- | ---------- | ------------ |
|        | NEW-1   | Implement RecipeSearchList component     | Medium     | UI-1, DB-3   |
|        | NEW-2   | Add recipe search/filter functionality   | High       | NEW-1, DB-3  |
|        | NEW-3   | Implement user notes for recipes         | Medium     | USER-2, DB-3 |
|        | NEW-4   | Add recipe categories/tags system        | Medium     | DB-3         |
|        | NEW-5   | Implement recipe rating system           | Medium     | USER-2, DB-3 |
|        | NEW-6   | Add recipe sharing via link              | Low        | DB-3         |
|        | NEW-7   | Implement recipe duplication for editing | Medium     | DB-3, USER-2 |
|        | NEW-8   | Add batch recipe import/export           | High       | DB-3         |
|        | NEW-9   | Implement recipe version history         | High       | DB-3         |
|        | NEW-10  | Add advanced search with filters         | High       | NEW-2, DB-3  |

## Data Structure Specifications

### Key Structure Patterns (Updated)

**Recipe Storage (ULID-based for chronological ordering):**

- User recipes: `["user_recipe", userId, ulid]` → Recipe data
- Public recipes: `["public_recipe", ulid]` → Recipe data
- Same ULID used when recipe is made public (no duplicate IDs)

**Ingredient Storage:**

- Ingredient primary keys: `["ingredient", ingredientId]` → ingredient data
- Ingredient type index: `["ingredient_type", type]` → ingredient reference
- Ingredient search index: `["ingredient_search", searchTerm]` → ingredient
  reference

**Note:** User favorites are now implemented via recipe copying (copyRecipe)
rather than separate favorite tracking. Inventory and notes features are not yet
implemented.

### Core Data Types

- Recipe: Contains name, description, instructions, image URL, category,
  ratings, visibility ("public" | "private"), createdBy (required), ULID-based
  IDs
- Ingredient: Contains name, description, type, common measurements
- RecipeIngredient: Links recipes and ingredients with quantity and measurement
  unit
- User: Contains user profile information and preferences

**Not Yet Implemented:**

- UserInventory: Would track ingredients a user has on hand
- UserNotes: Would store user-specific notes on recipes

**Simplified Features:**

- Favorites: Implemented via recipe copying ("Add to My Recipes") instead of
  separate favorite tracking

## Authentication Key Structure

- Magic link tokens: `["auth_tokens", token]` → token data with email and
  expiration
- User sessions: `["user_sessions", sessionId]` → session data
- User session lookup: `["user_session_lookup", userId, sessionId]` → true
- User email lookup: `["user_emails", email]` → userId
