# Barsistant Implementation Tasks

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
|        | DB-7    | Set up user favorites and recipe collections | Medium     | DB-3, USER-1 |
|        | DB-8    | Implement recipe sorting functionality       | Low        | DB-3         |

## AI Recipe Extraction Tasks

| Status | Task ID | Description                                                     | Complexity | Dependencies |
| ------ | ------- | --------------------------------------------------------------- | ---------- | ------------ |
| ✅     | AI-1    | Set up provider-agnostic AI SDK integration                     | Medium     | None         |
| ✅     | AI-2    | Create URL content fetching module                              | Medium     | None         |
| ✅     | AI-3    | Implement HTML text content extraction                          | Medium     | AI-2         |
| ✅     | AI-4    | Develop recipe extraction prompt engineering                    | High       | AI-1         |
| ✅     | AI-5    | Create structured data parser for AI outputs                    | Medium     | AI-4         |
|        | AI-6    | Implement recipe verification interface                         | Medium     | AI-5, UI-3   |
| ✅     | AI-7    | Implement recipe extraction handler                             | Medium     | AI-5, DB-3   |
|        | AI-8    | Add feedback mechanism for extraction quality                   | Medium     | AI-5, AI-6   |
| ✅     | AI-9    | Implement extraction evaluation system                          | Medium     | AI-4, AI-5   |
|        | AI-9    | Add YouTube content extraction support                          | High       | AI-2, AI-4   |
|        | AI-10   | Add recipe website extraction support                           | High       | AI-2, AI-4   |
|        | AI-11   | Develop extraction error handling                               | Medium     | AI-5, AI-7   |
|        | AI-12   | Create content sanitization for recipes                         | Medium     | AI-5         |
| ✅     | AI-13   | Implement AI cocktail image generation                          | High       | AI-1, DB-3   |
| ✅     | AI-14   | Adapt AI extraction to retrieve cocktail image URL from website | Medium     | AI-7, AI-10  |
| ✅     | AI-15   | AI-generated cocktail images for recipes                        | High       | AI-14, DB-3  |
| ✅     | AI-16   | S3 storage for generated cocktail images                        | Medium     | AI-13, AI-15 |
| ✅     | AI-17   | Make image generation non-blocking for recipe creation          | Medium     | AI-13, AI-15 |
| ✅     | AI-18   | Integrate recraft.ai for vector (SVG) cocktail image generation | High       | AI-13, AI-16 |

### AI-16 Implementation Details

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

### AI-17 Implementation Details (Expanded)

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

### AI-18 Implementation Details

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

### DEPLOY-4 Implementation Details

- Create a migrations system in `utils/db/migrations/`
- Track applied migrations in Deno KV with keys like
  `["db_meta", "migrations", migrationName]`
- On application startup, check for and apply pending migrations automatically
- Implement a migration runner that:
  - Discovers all migration files in the migrations directory
  - Determines which migrations have not yet been applied
  - Executes pending migrations in the correct order (based on timestamp or
    sequence number)
  - Records successful migrations in the database
- Create a migration template generator for new migrations
- Add safeguards to prevent destructive migrations in production without
  confirmation
- Implement a rollback mechanism for failed migrations
- Add logging for migration activities
- Write unit tests for the migration system
- Document migration process in development docs
- Update CI/CD pipeline to handle migrations during deployment

## User Interface Tasks

| Status | Task ID | Description                             | Complexity | Dependencies     |
| ------ | ------- | --------------------------------------- | ---------- | ---------------- |
| ✅     | UI-1    | Set up Tailwind CSS and daisyUI         | Low        | None             |
| ✅     | UI-2    | Create responsive layout templates      | Medium     | UI-1             |
| ✅     | UI-3    | Implement recipe display component      | Medium     | UI-1             |
|        | UI-4    | Create recipe search and filter UI      | Medium     | UI-1, DB-7       |
|        | UI-5    | Develop recipe submission form          | Medium     | UI-1, DB-3       |
|        | UI-6    | Implement recipe extraction form        | High       | AI-5, AI-6, UI-1 |
| ✅     | UI-7    | Create account management interface     | Medium     | UI-1, USER-1     |
|        | UI-8    | Develop recipe categories browser       | Medium     | UI-1, DB-3       |
|        | UI-9    | Create ingredient browsing interface    | Medium     | UI-1, DB-4       |
|        | UI-10   | Implement measurements adjustment UI    | Medium     | UI-3             |
|        | UI-11   | Create user favorites interface         | Medium     | UI-1, DB-7       |
|        | UI-12   | Implement accessibility features (WCAG) | High       | UI-3, UI-4, UI-5 |
|        | UI-13   | Add dark mode support                   | Low        | UI-1             |
| ✅     | UI-14   | Develop responsive mobile navigation    | Medium     | UI-1, UI-2       |
|        | UI-15   | Improve extraction loading feedback     | Low        | UI-1, AI-7       |

## User Management Tasks

| Status | Task ID | Description                              | Complexity | Dependencies   |
| ------ | ------- | ---------------------------------------- | ---------- | -------------- |
| ✅     | USER-1  | Implement magic link authentication      | Medium     | DB-1           |
| ✅     | USER-2  | Create user profile model and storage    | Medium     | DB-1, USER-1   |
| ✅     | USER-3  | Implement user preferences storage       | Medium     | USER-2         |
| ✅     | USER-4  | Create session management with Deno KV   | Medium     | USER-1         |
| ✅     | USER-5  | Implement authentication middleware      | Medium     | USER-1, USER-4 |
| ✅     | USER-6  | Create login and email verification UI   | Medium     | UI-1, USER-1   |
| ✅     | USER-7  | Set up email sending service             | Medium     | None           |
| ✅     | USER-8  | Implement session expiration and renewal | Low        | USER-4         |
| ✅     | USER-9  | Add rate limiting for auth requests      | Low        | USER-1         |
| ✅     | USER-10 | Create user profile settings UI          | Medium     | UI-7, USER-2   |
| ✅     | USER-11 | Implement admin mode with recipe management | Medium  | USER-1, USER-2, DB-3 |
|        | USER-12 | Implement user recipe collections        | Medium     | USER-2, DB-3   |
|        | USER-13 | Create recipe notes functionality        | Medium     | USER-2, DB-3   |

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

## Data Structure Specifications

### Key Structure Patterns

- Recipe primary keys: `["recipe", recipeId]` → recipe data
- Ingredient primary keys: `["ingredient", ingredientId]` → ingredient data
- Recipe-ingredient relationships:
  `["recipe_ingredient", recipeId, ingredientId]` → quantity data
- Secondary indexes: `["ingredient_recipes", ingredientId, recipeId]` → recipe
  reference
- User favorites: `["user_favorites", userId, recipeId]` → timestamp data
- User inventory: `["user_inventory", userId, ingredientId]` → quantity data
- User recipe notes: `["user_notes", userId, recipeId]` → notes data

### Core Data Types

- Recipe: Contains name, description, instructions, image URL, category, ratings
- Ingredient: Contains name, description, type, common measurements
- RecipeIngredient: Links recipes and ingredients with quantity and measurement
  unit
- User: Contains user profile information and preferences
- UserInventory: Tracks ingredients a user has on hand
- UserFavorites: Stores user's favorite recipes
- UserNotes: Stores user-specific notes on recipes

## Authentication Key Structure

- Magic link tokens: `["auth_tokens", token]` → token data with email and
  expiration
- User sessions: `["user_sessions", sessionId]` → session data
- User session lookup: `["user_session_lookup", userId, sessionId]` → true
- User email lookup: `["user_emails", email]` → userId
