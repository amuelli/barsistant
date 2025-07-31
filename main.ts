// Load .env file only in non-production environments
if (
  !Deno.env.get("DENO_DEPLOYMENT_ID") &&
  Deno.env.get("NODE_ENV") !== "production"
) {
  await import("@std/dotenv/load");
}

import { App, staticFiles } from "fresh";
import { runMigrationsOnStartup } from "🛠️/db/migration-runner.ts";
import { startQueueHandler } from "🛠️/db/queue-handler.ts";
import { State } from "🛠️/define.ts";

export const app = new App<State>()
  // Add static file serving middleware
  .use(staticFiles())
  // Enable file-system based routing
  .fsRoutes();

// Run database migrations before starting the application
await runMigrationsOnStartup();
// Start the application and queue handler
await startQueueHandler();
