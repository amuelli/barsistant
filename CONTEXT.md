# Barsistant

A cocktail recipe assistant. Users discover, save, and manage cocktail recipes.
AI features handle recipe extraction from URLs and image generation.

## Language

### Core domain

**Recipe**: A cocktail recipe — the central domain object. Has a name,
ingredients, instructions, and optional image. Owned by a User, optionally made
public. _Avoid_: Cocktail (too narrow — a Recipe is the document, not the
drink), drink

**Ingredient**: A named component used in one or more Recipes, with an optional
quantity and unit. _Avoid_: Item, component

**Extraction**: The AI-powered process of parsing a URL and producing a Recipe
from its contents. _Avoid_: Import, scraping, parsing

**Magic Link**: A single-use, time-limited URL emailed to a User to authenticate
them without a password. The only authentication mechanism in the system.
_Avoid_: Token link, email link, passwordless login (too generic)

**Session**: A server-side record in Deno KV that proves a User has
authenticated, identified by a cookie. Created after a Magic Link is consumed.
_Avoid_: Token, JWT, auth state

### Background job processing

**Background Job**: A unit of deferred work — currently always image generation
— persisted in Deno KV with an explicit lifecycle:
`pending → processing → done | failed`. Retry count and error are stored on the
record. _Avoid_: Task, queue message, event

**Job Store**: The module that exclusively owns all Deno KV reads and writes for
Background Job records. Nothing outside this module accesses job keys directly.
_Avoid_: Job queue, job repository

**Job Worker**: A Deno Worker module spawned by `enqueueJob()` that drains
pending Background Jobs from the Job Store and dispatches them to the
appropriate handler until the queue is empty, then exits. _Avoid_: Queue
handler, consumer, dispatcher

## Example dialogue

> "A user extracts a recipe — when does image generation start?"

"Extraction completes synchronously, then `enqueueJob()` writes a Background Job
to the Job Store and spawns a Job Worker. The Worker claims the job, calls the
raster image handler, and if that succeeds it enqueues a follow-up job for
vector image generation."

> "What if the AI API times out?"

"The Job Worker catches the error, calls `markJobFailed()` on the Job Store. If
the retry count is under the limit, the record resets to `pending` and the next
Worker spawn will pick it up."

> "How does the next Worker spawn get triggered?"

"Only by a new `enqueueJob()` call. If no new jobs arrive, the failed job stays
`pending` until something else triggers a Worker — or until manual intervention
resets it."
