import { App, fsRoutes, staticFiles } from "fresh";
import { runMigrationsOnStartup } from "🛠️/db/migration-runner.ts";
import { startQueueHandler } from "🛠️/db/queue-handler.ts";
import { State } from "🛠️/define.ts";

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
