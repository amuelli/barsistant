/// <reference lib="deno.unstable" />

import { assertEquals, assertExists } from "@std/assert";
import { JobRecord, JobStore } from "./job-store.ts";

Deno.test("JobStore - createJob produces a pending record", async () => {
  const kv = await Deno.openKv(":memory:");
  const store = new JobStore(kv);

  const id = await store.createJob("test_job", { data: "test" });
  assertExists(id);

  const entry = await kv.get<JobRecord>(["job_queue", id]);
  assertExists(entry.value);
  assertEquals(entry.value.status, "pending");
  assertEquals(entry.value.type, "test_job");
  assertEquals(entry.value.retries, 0);

  await kv.close();
});

Deno.test("JobStore - claimNextPendingJob transitions record to processing", async () => {
  const kv = await Deno.openKv(":memory:");
  const store = new JobStore(kv);

  const id = await store.createJob("test_job", { data: "test" });

  const claimed = await store.claimNextPendingJob();
  assertExists(claimed);
  assertEquals(claimed.status, "processing");
  assertEquals(claimed.id, id);

  const entry = await kv.get<JobRecord>(["job_queue", id]);
  assertEquals(entry.value?.status, "processing");

  await kv.close();
});

Deno.test("JobStore - concurrent claimNextPendingJob only claims a job once", async () => {
  const kv = await Deno.openKv(":memory:");
  const store = new JobStore(kv);

  await store.createJob("concurrent_test_job", {});

  const [a, b] = await Promise.all([
    store.claimNextPendingJob(),
    store.claimNextPendingJob(),
  ]);

  const claimedCount = [a, b].filter((r) => r !== null).length;
  assertEquals(claimedCount, 1);

  await kv.close();
});

Deno.test("JobStore - markJobDone produces a done record", async () => {
  const kv = await Deno.openKv(":memory:");
  const store = new JobStore(kv);

  const id = await store.createJob("done_test_job", {});
  await store.claimNextPendingJob();
  await store.markJobDone(id);

  const entry = await kv.get<JobRecord>(["job_queue", id]);
  assertEquals(entry.value?.status, "done");

  await kv.close();
});

Deno.test("JobStore - markJobFailed under maxRetries resets to pending and increments counter", async () => {
  const kv = await Deno.openKv(":memory:");
  const store = new JobStore(kv);

  const id = await store.createJob("retry_job", {}, { maxRetries: 3 });
  await store.claimNextPendingJob();
  await store.markJobFailed(id, "transient error");

  const entry = await kv.get<JobRecord>(["job_queue", id]);
  assertExists(entry.value);
  assertEquals(entry.value.status, "pending");
  assertEquals(entry.value.retries, 1);
  assertEquals(entry.value.error, "transient error");

  await kv.close();
});

Deno.test("JobStore - markJobFailed at maxRetries sets status to failed", async () => {
  const kv = await Deno.openKv(":memory:");
  const store = new JobStore(kv);

  const id = await store.createJob("fail_job", {}, { maxRetries: 1 });
  await store.claimNextPendingJob();
  await store.markJobFailed(id, "permanent error");

  const entry = await kv.get<JobRecord>(["job_queue", id]);
  assertExists(entry.value);
  assertEquals(entry.value.status, "failed");
  assertEquals(entry.value.retries, 1);

  await kv.close();
});
