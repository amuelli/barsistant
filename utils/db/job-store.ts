/// <reference lib="deno.unstable" />

import { ulid } from "@std/ulid";
import { getKv } from "./db.ts";

export type JobStatus = "pending" | "processing" | "done" | "failed";

export interface JobRecord {
  id: string;
  type: string;
  payload: unknown;
  status: JobStatus;
  retries: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

const DEFAULT_MAX_RETRIES = 3;
const STALE_PROCESSING_MS = 5 * 60 * 1000; // 5 minutes

export async function createJob(
  type: string,
  payload: unknown,
  options?: { maxRetries?: number; kv?: Deno.Kv },
): Promise<string> {
  const kv = options?.kv ?? await getKv();
  const id = ulid();
  const now = new Date().toISOString();
  const record: JobRecord = {
    id,
    type,
    payload,
    status: "pending",
    retries: 0,
    maxRetries: options?.maxRetries ?? DEFAULT_MAX_RETRIES,
    createdAt: now,
    updatedAt: now,
  };
  await kv.set(["job_queue", id], record);
  return id;
}

export async function claimNextPendingJob(
  kv?: Deno.Kv,
): Promise<JobRecord | null> {
  const resolvedKv = kv ?? await getKv();
  for await (
    const entry of resolvedKv.list<JobRecord>({ prefix: ["job_queue"] })
  ) {
    const job = entry.value;

    if (job.status === "processing") {
      const ageMs = Date.now() - new Date(job.updatedAt).getTime();
      if (ageMs < STALE_PROCESSING_MS) continue;

      // Job has been stuck in processing longer than the threshold — reclaim it
      const newRetries = job.retries + 1;
      if (newRetries >= job.maxRetries) {
        await resolvedKv.atomic()
          .check(entry)
          .set(["job_queue", job.id], {
            ...job,
            status: "failed",
            retries: newRetries,
            error: `stale: stuck in processing for ${
              Math.round(ageMs / 60000)
            } minutes`,
            updatedAt: new Date().toISOString(),
          })
          .commit();
        continue;
      }

      const reclaimed: JobRecord = {
        ...job,
        status: "processing",
        retries: newRetries,
        error: undefined,
        updatedAt: new Date().toISOString(),
      };
      const result = await resolvedKv.atomic()
        .check(entry)
        .set(["job_queue", job.id], reclaimed)
        .commit();
      if (result.ok) {
        console.warn(
          `[job-store] Reclaimed stale job ${job.id} (retry ${newRetries}/${job.maxRetries})`,
        );
        return reclaimed;
      }
      continue;
    }

    if (job.status !== "pending") continue;

    const updated: JobRecord = {
      ...job,
      status: "processing",
      updatedAt: new Date().toISOString(),
    };
    const result = await resolvedKv.atomic()
      .check(entry)
      .set(["job_queue", job.id], updated)
      .commit();
    if (result.ok) {
      return updated;
    }
    // Another concurrent worker claimed this job — try the next one
  }
  return null;
}

export async function markJobDone(
  jobId: string,
  kv?: Deno.Kv,
): Promise<void> {
  const resolvedKv = kv ?? await getKv();
  const key = ["job_queue", jobId];
  const entry = await resolvedKv.get<JobRecord>(key);
  if (!entry.value) return;
  await resolvedKv.set(key, {
    ...entry.value,
    status: "done",
    updatedAt: new Date().toISOString(),
  });
}

export async function markJobFailed(
  jobId: string,
  error: string,
  kv?: Deno.Kv,
): Promise<void> {
  const resolvedKv = kv ?? await getKv();
  const key = ["job_queue", jobId];
  const entry = await resolvedKv.get<JobRecord>(key);
  if (!entry.value) return;
  const record = entry.value;
  const newRetries = record.retries + 1;
  await resolvedKv.set(key, {
    ...record,
    status: newRetries < record.maxRetries ? "pending" : "failed",
    retries: newRetries,
    error,
    updatedAt: new Date().toISOString(),
  });
}
