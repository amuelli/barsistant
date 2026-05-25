/// <reference lib="deno.unstable" />

import { assertEquals, assertExists } from "@std/assert";
import { _setJobStoreForTesting, JobRecord, JobStore } from "./job-store.ts";
import { enqueueJob, processJobsWithHandlers } from "./queue-handler.ts";

Deno.test("enqueueJob - smoke test: creates a pending record with correct type", async () => {
  const kv = await Deno.openKv(":memory:");
  const store = new JobStore(kv);
  _setJobStoreForTesting(store);

  try {
    await enqueueJob({
      type: "generate_recipe_raster_image",
      recipeId: "test-id",
    });

    const jobs: JobRecord[] = [];
    for await (const entry of kv.list<JobRecord>({ prefix: ["job_queue"] })) {
      jobs.push(entry.value);
    }

    assertEquals(jobs.length, 1);
    assertEquals(jobs[0].type, "generate_recipe_raster_image");
    assertEquals(jobs[0].status, "pending");
  } finally {
    _setJobStoreForTesting(null);
    await kv.close();
  }
});

Deno.test("processJobsWithHandlers - success: marks job done and calls handler", async () => {
  const kv = await Deno.openKv(":memory:");
  const store = new JobStore(kv);

  let handlerCalled = false;
  const handlers = {
    test_job: (_payload: unknown) => {
      handlerCalled = true;
      return Promise.resolve();
    },
  };

  const id = await store.createJob("test_job", { recipeId: "abc" });
  await processJobsWithHandlers(store, handlers);

  assertEquals(handlerCalled, true);

  const entry = await kv.get<JobRecord>(["job_queue", id]);
  assertExists(entry.value);
  assertEquals(entry.value.status, "done");

  await kv.close();
});

Deno.test("processJobsWithHandlers - failure: increments retry counter on handler throw", async () => {
  const kv = await Deno.openKv(":memory:");
  const store = new JobStore(kv);

  const handlers = {
    failing_job: (_payload: unknown) => {
      throw new Error("handler always fails");
    },
  };

  const id = await store.createJob("failing_job", {}, { maxRetries: 3 });
  await processJobsWithHandlers(store, handlers);

  const entry = await kv.get<JobRecord>(["job_queue", id]);
  assertExists(entry.value);
  assertEquals(entry.value.retries, 1);
  assertEquals(entry.value.status, "pending");
  assertEquals(entry.value.error, "handler always fails");

  await kv.close();
});
