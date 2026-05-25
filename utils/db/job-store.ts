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
    if (entry.value.status !== "pending") continue;
    const updated: JobRecord = {
      ...entry.value,
      status: "processing",
      updatedAt: new Date().toISOString(),
    };
    const result = await resolvedKv.atomic()
      .check(entry)
      .set(["job_queue", entry.value.id], updated)
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
