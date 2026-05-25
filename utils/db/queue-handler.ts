/// <reference lib="deno.unstable" />

import { createJob } from "./job-store.ts";
import type { GenerateRecipeRasterImageJob } from "./recipe-raster-image-job.ts";
import type { GenerateRecipeVectorImageJob } from "./recipe-vector-image-job.ts";

export type QueueJob =
  | GenerateRecipeRasterImageJob
  | GenerateRecipeVectorImageJob;

export async function enqueueJob(job: QueueJob): Promise<void> {
  await createJob(job.type, job);
  new Worker(import.meta.resolve("./job-worker.ts"), { type: "module" });
}
