/// <reference lib="deno.unstable" />

import { getKv } from "./db.ts";
import {
  claimNextPendingJob,
  markJobDone,
  markJobFailed,
} from "./job-store.ts";
import {
  handleGenerateRecipeRasterImageJob,
  isGenerateRecipeRasterImageJob,
} from "./recipe-raster-image-job.ts";
import {
  handleGenerateRecipeVectorImageJob,
  isGenerateRecipeVectorImageJob,
} from "./recipe-vector-image-job.ts";

export type JobHandler = (payload: unknown) => Promise<void>;

export interface DrainOptions {
  handlers?: Record<string, JobHandler>;
  kv?: Deno.Kv;
}

const defaultHandlers: Record<string, JobHandler> = {
  generate_recipe_raster_image: async (payload) => {
    if (!isGenerateRecipeRasterImageJob(payload)) {
      throw new Error("Invalid generate_recipe_raster_image payload");
    }
    await handleGenerateRecipeRasterImageJob(payload);
  },
  generate_recipe_vector_image: async (payload) => {
    if (!isGenerateRecipeVectorImageJob(payload)) {
      throw new Error("Invalid generate_recipe_vector_image payload");
    }
    await handleGenerateRecipeVectorImageJob(payload);
  },
};

export async function drainJobs(options?: DrainOptions): Promise<void> {
  const kv = options?.kv ?? await getKv();
  const handlers = options?.handlers ?? defaultHandlers;

  while (true) {
    const job = await claimNextPendingJob(kv);
    if (!job) break;

    console.log(`[job-worker] Processing job ${job.id} (type: ${job.type})`);

    const handler = handlers[job.type];
    if (!handler) {
      const msg = `Unknown job type: ${job.type}`;
      console.error(`[job-worker] ${msg}`);
      await markJobFailed(job.id, msg, kv);
      continue;
    }

    try {
      await handler(job.payload);
      await markJobDone(job.id, kv);
      console.log(`[job-worker] Job ${job.id} completed`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[job-worker] Job ${job.id} failed: ${errorMessage}`);
      await markJobFailed(job.id, errorMessage, kv);
    }
  }
}
