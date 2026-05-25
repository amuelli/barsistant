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

export class JobStore {
  constructor(private kv: Deno.Kv) {}

  async createJob(
    type: string,
    payload: unknown,
    options?: { maxRetries?: number },
  ): Promise<string> {
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
    await this.kv.set(["job_queue", id], record);
    return id;
  }

  async claimNextPendingJob(skipIds?: Set<string>): Promise<JobRecord | null> {
    for await (
      const entry of this.kv.list<JobRecord>({ prefix: ["job_queue"] })
    ) {
      if (entry.value.status !== "pending") continue;
      if (skipIds?.has(entry.value.id)) continue;

      const updated: JobRecord = {
        ...entry.value,
        status: "processing",
        updatedAt: new Date().toISOString(),
      };

      const result = await this.kv.atomic()
        .check(entry)
        .set(entry.key, updated)
        .commit();

      if (result.ok) {
        return updated;
      }
      // Concurrent cron fired and claimed this job — try the next one
    }
    return null;
  }

  async markJobDone(jobId: string): Promise<void> {
    const key = ["job_queue", jobId];
    const entry = await this.kv.get<JobRecord>(key);
    if (!entry.value) return;

    await this.kv.set(
      key,
      {
        ...entry.value,
        status: "done",
        updatedAt: new Date().toISOString(),
      } satisfies JobRecord,
    );
  }

  async markJobFailed(jobId: string, error: string): Promise<void> {
    const key = ["job_queue", jobId];
    const entry = await this.kv.get<JobRecord>(key);
    if (!entry.value) return;

    const record = entry.value;
    const newRetries = record.retries + 1;

    await this.kv.set(
      key,
      {
        ...record,
        retries: newRetries,
        error,
        updatedAt: new Date().toISOString(),
        status: newRetries < record.maxRetries ? "pending" : "failed",
      } satisfies JobRecord,
    );
  }
}

let _jobStore: JobStore | null = null;
let _jobStoreOverride: JobStore | null = null;

export async function getJobStore(): Promise<JobStore> {
  if (_jobStoreOverride) return _jobStoreOverride;
  if (!_jobStore) {
    _jobStore = new JobStore(await getKv());
  }
  return _jobStore;
}

export function _setJobStoreForTesting(store: JobStore | null): void {
  _jobStoreOverride = store;
}
