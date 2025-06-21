/// <reference lib="deno.unstable" />

import { getKv } from "./db.ts";
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

export async function startQueueHandler() {
  console.log("[queue-handler] Deno KV queue listener registered and active");
  const kv = await getKv();
  kv.listenQueue(async (msg: unknown) => {
    console.log("[queue-handler] Received message", msg);

    if (isGenerateRecipeRasterImageJob(msg)) {
      await handleGenerateRecipeRasterImageJob(msg);
      return;
    }

    if (isGenerateRecipeVectorImageJob(msg)) {
      await handleGenerateRecipeVectorImageJob(msg);
      return;
    }

    // ...add more message types here as needed...
    console.error("[queue-handler] Unknown queue message type", msg);
  });
}

/**
 * Enqueue a job to the Deno KV queue
 * Only accepts known job types for type safety
 */
export type QueueJob =
  | GenerateRecipeRasterImageJob
  | GenerateRecipeVectorImageJob;

export async function enqueueJob(job: QueueJob): Promise<void> {
  const kv = await getKv();
  await kv.enqueue(job);
}
