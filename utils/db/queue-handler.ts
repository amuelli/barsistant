/// <reference lib="deno.unstable" />

import { createJob } from "./job-store.ts";
import { drainJobs } from "./job-worker.ts";
import type { GenerateRecipeRasterImageJob } from "./recipe-raster-image-job.ts";
import type { GenerateRecipeVectorImageJob } from "./recipe-vector-image-job.ts";

export type QueueJob =
  | GenerateRecipeRasterImageJob
  | GenerateRecipeVectorImageJob;

export async function enqueueJob(job: QueueJob): Promise<void> {
  await createJob(job.type, job);
  // Fire-and-forget: Deno Deploy keeps the isolate alive while this promise is
  // pending, giving it the same background-processing semantics as a Worker
  // without the module-path resolution issues that Workers have in Fresh builds.
  drainJobs().catch((err) =>
    console.error("[queue-handler] Background drain error:", err)
  );
}
