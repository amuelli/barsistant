#!/usr/bin/env -S deno run -A --watch=static/,routes/
import { tailwind } from "@fresh/plugin-tailwind";
import "@std/dotenv/load";
import { Builder } from "fresh/dev";
import { getMigrationStatus } from "🛠️/db/migrations/index.ts";
import { startQueueHandler } from "🛠️/db/queue-handler.ts";

const builder = new Builder();
tailwind(builder);

/**
 * Print the migration status for development info
 */
async function printMigrationStatus() {
  console.log("\n📊 Migration Status:");
  console.log("===================");

  try {
    const status = await getMigrationStatus();

    if (status.length === 0) {
      console.log("No migrations found.");
      return;
    }

    const applied = status.filter((m) => m.status === "applied");
    const pending = status.filter((m) => m.status === "pending");

    console.log(`Applied migrations: ${applied.length}`);
    console.log(`Pending migrations: ${pending.length}`);

    // Only show details if there are pending migrations
    if (pending.length > 0) {
      console.log("\nPending migrations:");
      for (const migration of pending) {
        console.log(`⏳ ${migration.name}`);
      }
      console.log(
        "\nRun 'deno task migration:run' to apply pending migrations\n",
      );
    }
  } catch (error) {
    console.error(
      "Failed to check migration status:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

if (Deno.args.includes("build")) {
  await builder.build();
} else {
  // Check migration status when starting dev server
  await printMigrationStatus();

  await builder.listen(() => import("./main.ts"));
  await startQueueHandler();
}
