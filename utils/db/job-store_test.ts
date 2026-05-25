/// <reference lib="deno.unstable" />

import { assertEquals, assertExists } from "@std/assert";
import {
  claimNextPendingJob,
  createJob,
  type JobRecord,
  markJobDone,
  markJobFailed,
} from "./job-store.ts";

Deno.test("createJob produces a pending record readable from KV", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    const jobId = await createJob("test_job", { data: "hello" }, { kv });
    assertExists(jobId);
    const entry = await kv.get<JobRecord>(["job_queue", jobId]);
    assertExists(entry.value);
    assertEquals(entry.value.status, "pending");
    assertEquals(entry.value.type, "test_job");
    assertEquals(entry.value.retries, 0);
    assertEquals(entry.value.maxRetries, 3);
  } finally {
    kv.close();
  }
});

Deno.test("claimNextPendingJob transitions record to processing", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    const jobId = await createJob("claim_test", { x: 1 }, { kv });
    const claimed = await claimNextPendingJob(kv);
    assertExists(claimed);
    assertEquals(claimed.status, "processing");
    assertEquals(claimed.id, jobId);

    // Verify the record in KV reflects the processing state
    const entry = await kv.get<JobRecord>(["job_queue", jobId]);
    assertEquals(entry.value?.status, "processing");
  } finally {
    kv.close();
  }
});

Deno.test("claimNextPendingJob returns null when no pending jobs", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    const result = await claimNextPendingJob(kv);
    assertEquals(result, null);
  } finally {
    kv.close();
  }
});

Deno.test("concurrent claimNextPendingJob calls only claim the job once", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    await createJob("race_test", {}, { kv });

    const [result1, result2] = await Promise.all([
      claimNextPendingJob(kv),
      claimNextPendingJob(kv),
    ]);

    const claimed = [result1, result2].filter(Boolean);
    assertEquals(
      claimed.length,
      1,
      "Only one concurrent caller should claim the job",
    );
  } finally {
    kv.close();
  }
});

Deno.test("markJobDone produces a done record", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    const jobId = await createJob("done_test", {}, { kv });
    await markJobDone(jobId, kv);
    const entry = await kv.get<JobRecord>(["job_queue", jobId]);
    assertEquals(entry.value?.status, "done");
  } finally {
    kv.close();
  }
});

Deno.test("markJobFailed under maxRetries resets to pending and increments counter", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    const jobId = await createJob("retry_test", {}, { kv, maxRetries: 3 });
    await markJobFailed(jobId, "transient error", kv);
    const entry = await kv.get<JobRecord>(["job_queue", jobId]);
    assertEquals(entry.value?.status, "pending");
    assertEquals(entry.value?.retries, 1);
    assertEquals(entry.value?.error, "transient error");
  } finally {
    kv.close();
  }
});

Deno.test("markJobFailed at maxRetries sets status to failed", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    const jobId = await createJob("exhaust_test", {}, { kv, maxRetries: 1 });
    await markJobFailed(jobId, "permanent error", kv);
    const entry = await kv.get<JobRecord>(["job_queue", jobId]);
    assertEquals(entry.value?.status, "failed");
    assertEquals(entry.value?.retries, 1);
  } finally {
    kv.close();
  }
});

Deno.test("claimNextPendingJob reclaims a stale processing job", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    const jobId = await createJob("stale_test", {}, { kv });

    // Simulate a job stuck in processing with an old updatedAt timestamp
    await kv.set(["job_queue", jobId], {
      ...(await kv.get<JobRecord>(["job_queue", jobId])).value,
      status: "processing",
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    });

    const claimed = await claimNextPendingJob(kv);
    assertExists(claimed);
    assertEquals(claimed.id, jobId);
    assertEquals(claimed.status, "processing");
    assertEquals(claimed.retries, 1);
  } finally {
    kv.close();
  }
});

Deno.test("claimNextPendingJob marks stale job as failed when retries exhausted", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    const jobId = await createJob("stale_exhaust", {}, { kv, maxRetries: 1 });

    // Simulate a job stuck in processing with retries already at maxRetries - 1
    await kv.set(["job_queue", jobId], {
      ...(await kv.get<JobRecord>(["job_queue", jobId])).value,
      status: "processing",
      retries: 0, // newRetries will be 1, which equals maxRetries=1 → failed
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    });

    const result = await claimNextPendingJob(kv);
    assertEquals(result, null); // Exhausted — marked failed, not claimed

    const entry = await kv.get<JobRecord>(["job_queue", jobId]);
    assertEquals(entry.value?.status, "failed");
  } finally {
    kv.close();
  }
});
