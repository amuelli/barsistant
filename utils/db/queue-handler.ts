/// <reference lib="deno.unstable" />

import type { GenerateRecipeRasterImageJob } from "./recipe-raster-image-job.ts";
import {
  handleGenerateRecipeRasterImageJob,
  isGenerateRecipeRasterImageJob,
} from "./recipe-raster-image-job.ts";
import type { GenerateRecipeVectorImageJob } from "./recipe-vector-image-job.ts";
import {
  handleGenerateRecipeVectorImageJob,
  isGenerateRecipeVectorImageJob,
} from "./recipe-vector-image-job.ts";
import { getJobStore, type JobRecord, type JobStore } from "./job-store.ts";

export type QueueJob =
  | GenerateRecipeRasterImageJob
  | GenerateRecipeVectorImageJob;

export async function enqueueJob(job: QueueJob): Promise<void> {
  const store = await getJobStore();
  await store.createJob(job.type, job);
}

type JobHandler = (payload: unknown) => Promise<void>;
type HandlerMap = Record<string, JobHandler>;

const DEFAULT_HANDLERS: HandlerMap = {
  generate_recipe_raster_image: (payload) => {
    if (!isGenerateRecipeRasterImageJob(payload)) {
      throw new Error(`Invalid payload for generate_recipe_raster_image`);
    }
    return handleGenerateRecipeRasterImageJob(payload);
  },
  generate_recipe_vector_image: (payload) => {
    if (!isGenerateRecipeVectorImageJob(payload)) {
      throw new Error(`Invalid payload for generate_recipe_vector_image`);
    }
    return handleGenerateRecipeVectorImageJob(payload);
  },
};

export async function processJobsWithHandlers(
  store: JobStore,
  handlers: HandlerMap,
): Promise<void> {
  const processedThisRun = new Set<string>();

  while (true) {
    const job: JobRecord | null = await store.claimNextPendingJob(
      processedThisRun,
    );
    if (!job) break;

    processedThisRun.add(job.id);

    const handler = handlers[job.type];
    try {
      if (!handler) throw new Error(`Unknown job type: ${job.type}`);
      await handler(job.payload);
      await store.markJobDone(job.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[cron-dispatcher] Job ${job.id} (${job.type}) failed: ${message}`,
      );
      await store.markJobFailed(job.id, message);
    }
  }
}

async function processPendingJobs(): Promise<void> {
  const store = await getJobStore();
  await processJobsWithHandlers(store, DEFAULT_HANDLERS);
}

export function startCronDispatcher(): void {
  console.log(
    "[cron-dispatcher] Registering cron job for background processing",
  );
  Deno.cron("Process background jobs", "* * * * *", async () => {
    console.log("[cron-dispatcher] Processing pending jobs");
    try {
      await processPendingJobs();
    } catch (error) {
      console.error(
        "[cron-dispatcher] Unexpected error processing jobs:",
        error,
      );
    }
    console.log("[cron-dispatcher] Done processing pending jobs");
  });
}
