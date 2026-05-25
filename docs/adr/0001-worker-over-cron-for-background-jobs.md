# Worker-based consumer over Deno.cron for background job processing

Deno KV Queues (`kv.listenQueue`) are not supported on Deno Deploy, so a
replacement was needed. The two candidates were a `Deno.cron` polling loop (fire
every minute, claim pending jobs from KV) and a Deno Worker spawned directly
from `enqueueJob()` (process immediately, drain until empty, then exit).

We chose the Worker approach because it preserves the trigger-on-enqueue
semantics of the original KVQ system — processing starts as soon as a job is
created rather than up to 60 seconds later — and because it requires no unstable
Deno APIs (`Deno.cron` needs `"unstable": ["cron"]` in `deno.json`), no change
to `main.ts` beyond removing the old `startQueueHandler()` call, and no
persistent background process consuming resources when the queue is idle.

## Considered options

**Deno.cron polling** — rejected because of up to 60-second processing latency,
the requirement for an unstable API flag, and the need to register the cron job
at startup in `main.ts`, which is a departure from the fire-and-forget pattern
callers already expect from `enqueueJob()`.

**Deno KV Queues (status quo)** — not supported on Deno Deploy; the reason this
decision exists at all.

## Consequences

A Worker crash before a job is marked `done` or `failed` will leave that job
stuck in `processing` indefinitely. Recovery from this state requires manual
intervention and is out of scope for the initial implementation.
