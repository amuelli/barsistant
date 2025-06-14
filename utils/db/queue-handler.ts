/// <reference lib="deno.unstable" />

import { getKv } from "./db.ts";
import {
  handleGenerateRecipeImageJob,
  isGenerateRecipeImageJob,
} from "./recipe-image-job.ts";

console.log("[queue-handler] Deno KV queue listener registered and active");

const kv = await getKv();

kv.listenQueue(async (msg: unknown) => {
  console.log("[queue-handler] Received message", msg);
  if (isGenerateRecipeImageJob(msg)) {
    await handleGenerateRecipeImageJob(msg);
    return;
  }
  // ...add more message types here as needed...
  console.error("[queue-handler] Unknown queue message type", msg);
});
