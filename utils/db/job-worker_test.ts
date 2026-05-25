/// <reference lib="deno.unstable" />

import { assertEquals, assertExists } from "@std/assert";
import { createJob, type JobRecord } from "./job-store.ts";
import { drainJobs } from "./job-worker.ts";

Deno.test("drainJobs processes pending job and marks it done", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    let handlerCalled = false;
    let receivedPayload: unknown;

    const handlers = {
      test_job: (payload: unknown) => {
        handlerCalled = true;
        receivedPayload = payload;
        return Promise.resolve();
      },
    };

    const jobId = await createJob("test_job", { recipeId: "abc123" }, { kv });
    await drainJobs({ handlers, kv });

    const entry = await kv.get<JobRecord>(["job_queue", jobId]);
    assertExists(entry.value);
    assertEquals(entry.value.status, "done");
    assertEquals(handlerCalled, true);
    assertEquals(
      (receivedPayload as Record<string, unknown>).recipeId,
      "abc123",
    );
  } finally {
    kv.close();
  }
});

Deno.test("drainJobs exhausts retries and marks job failed", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    const handlers = {
      failing_job: (_payload: unknown): Promise<void> => {
        return Promise.reject(new Error("simulated failure"));
      },
    };

    // maxRetries=3 means the job attempts 3 times before becoming failed
    const jobId = await createJob("failing_job", {}, { kv, maxRetries: 3 });
    await drainJobs({ handlers, kv });

    const entry = await kv.get<JobRecord>(["job_queue", jobId]);
    assertExists(entry.value);
    assertEquals(entry.value.status, "failed");
    assertEquals(entry.value.retries, 3);
    assertEquals(entry.value.error, "simulated failure");
  } finally {
    kv.close();
  }
});

Deno.test("drainJobs marks unknown job type as failed after exhausting retries", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    // Use maxRetries=1 so it fails after one attempt
    const jobId = await createJob("unknown_type", {}, { kv, maxRetries: 1 });
    await drainJobs({ handlers: {}, kv });

    const entry = await kv.get<JobRecord>(["job_queue", jobId]);
    assertExists(entry.value);
    assertEquals(entry.value.status, "failed");
    assertEquals(entry.value.retries, 1);
  } finally {
    kv.close();
  }
});

Deno.test("drainJobs leaves a timed-out job in processing and continues to next job", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    let secondJobProcessed = false;
    const handlers = {
      // This handler never resolves — simulates a hanging operation
      hanging_job: (_payload: unknown): Promise<void> => new Promise(() => {}),
      next_job: (_payload: unknown) => {
        secondJobProcessed = true;
        return Promise.resolve();
      },
    };

    const hangingId = await createJob("hanging_job", {}, {
      kv,
      maxRetries: 3,
    });
    const nextId = await createJob("next_job", {}, { kv });

    // Use a very short timeout override for the test — we can't test the real 3min timeout
    // so we manually put the hanging job into processing state (simulating it timed out)
    // and leave next_job as pending. drainJobs should skip the processing job and run next_job.
    await kv.set(["job_queue", hangingId], {
      ...(await kv.get<JobRecord>(["job_queue", hangingId])).value,
      status: "processing",
    });

    await drainJobs({ handlers, kv });

    const hangingEntry = await kv.get<JobRecord>(["job_queue", hangingId]);
    const nextEntry = await kv.get<JobRecord>(["job_queue", nextId]);

    // Hanging job stays in processing (not old enough for stale recovery)
    assertEquals(hangingEntry.value?.status, "processing");
    // Next job was processed despite the hanging one
    assertEquals(nextEntry.value?.status, "done");
    assertEquals(secondJobProcessed, true);
  } finally {
    kv.close();
  }
});

Deno.test("drainJobs processes multiple pending jobs in sequence", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    const processed: string[] = [];
    const handlers = {
      ordered_job: (payload: unknown) => {
        processed.push((payload as Record<string, unknown>).name as string);
        return Promise.resolve();
      },
    };

    const id1 = await createJob("ordered_job", { name: "first" }, { kv });
    const id2 = await createJob("ordered_job", { name: "second" }, { kv });

    await drainJobs({ handlers, kv });

    const entry1 = await kv.get<JobRecord>(["job_queue", id1]);
    const entry2 = await kv.get<JobRecord>(["job_queue", id2]);
    assertEquals(entry1.value?.status, "done");
    assertEquals(entry2.value?.status, "done");
    assertEquals(processed.length, 2);
  } finally {
    kv.close();
  }
});
