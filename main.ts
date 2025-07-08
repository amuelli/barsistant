import "@std/dotenv/load";
import { App, fsRoutes, staticFiles } from "fresh";
import { type State } from "./utils.ts";
import { runMigrationsOnStartup } from "./utils/db/migration-runner.ts";
import { startQueueHandler } from "./utils/db/queue-handler.ts";

export const app = new App<State>();

app.use(staticFiles());

await fsRoutes(app, {
  loadIsland: (path) => import(`./islands/${path}`),
  loadRoute: (path) => import(`./routes/${path}`),
});

if (import.meta.main) {
  // Run database migrations before starting the application
  await runMigrationsOnStartup();

  // Start the application and queue handler
  await app.listen();
  await startQueueHandler();
}
