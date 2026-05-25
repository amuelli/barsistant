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
