/**
 * Migration Manager CLI
 *
 * This script provides commands for managing database migrations.
 *
 * Usage:
 * ```
 * deno run -A scripts/migrations.ts [command]
 * ```
 *
 * Commands:
 * - status: Show status of all migrations
 * - run: Run pending migrations
 * - approve [name]: Approve a dangerous migration for production
 * - rollback [name]: Roll back a specific migration
 */

import { getKv } from "../utils/db/db.ts";
import {
  getMigrationStatus,
  runMigrations,
} from "../utils/db/migrations/index.ts";
import type { MigrationOptions } from "../utils/db/migrations/types.ts";

const command = Deno.args[0]?.toLowerCase();
const migrationName = Deno.args[1];

if (!command) {
  printUsage();
  Deno.exit(1);
}

switch (command) {
  case "status":
    await showStatus();
    break;
  case "run":
    await runAllMigrations();
    break;
  case "approve":
    if (!migrationName) {
      console.error("Error: Migration name is required for approve command");
      printUsage();
      Deno.exit(1);
    }
    await approveMigration(migrationName);
    break;
  case "rollback":
    if (!migrationName) {
      console.error("Error: Migration name is required for rollback command");
      printUsage();
      Deno.exit(1);
    }
    await rollbackMigration(migrationName);
    break;
  default:
    console.error(`Error: Unknown command '${command}'`);
    printUsage();
    Deno.exit(1);
}

function printUsage() {
  console.log("Usage: deno run -A scripts/migrations.ts [command]");
  console.log("");
  console.log("Commands:");
  console.log("  status                 Show status of all migrations");
  console.log("  run                    Run pending migrations");
  console.log(
    "  approve [name]         Approve a dangerous migration for production",
  );
  console.log("  rollback [name]        Roll back a specific migration");
}

/**
 * Shows the status of all migrations
 */
async function showStatus() {
  console.log("Checking migration status...");
  const status = await getMigrationStatus();

  console.log("\nMigration Status:");
  console.log("=================\n");

  if (status.length === 0) {
    console.log("No migrations found.");
    return;
  }

  const applied = status.filter((m) => m.status === "applied");
  const pending = status.filter((m) => m.status === "pending");

  console.log(`Applied migrations: ${applied.length}`);
  console.log(`Pending migrations: ${pending.length}`);
  console.log("");

  // Display all migrations with their status
  for (const migration of status) {
    const statusSymbol = migration.status === "applied" ? "✅" : "⏳";
    console.log(`${statusSymbol} ${migration.name} (${migration.status})`);
  }
}

/**
 * Runs all pending migrations
 */
async function runAllMigrations() {
  console.log("Running pending migrations...");

  const options: MigrationOptions = {
    stopOnError: true,
    rollbackOnError: true,
    allowDangerousMigrations: false,
  };

  // Check for dry run flag
  if (Deno.args.includes("--dry-run")) {
    options.dryRun = true;
    console.log("DRY RUN: No changes will be applied");
  }

  const results = await runMigrations(options);

  console.log("\nMigration Results:");
  console.log("=================\n");

  if (results.length === 0) {
    console.log("No migrations were run (all already applied).");
    return;
  }

  // Display results
  for (const result of results) {
    let statusSymbol;

    switch (result.status) {
      case "applied":
        statusSymbol = "✅";
        break;
      case "failed":
        statusSymbol = "❌";
        break;
      case "skipped":
        statusSymbol = "⏭️";
        break;
      case "rolled_back":
        statusSymbol = "⏮️";
        break;
      default:
        statusSymbol = "❓";
    }

    console.log(`${statusSymbol} ${result.name} (${result.status})`);

    if (result.error) {
      console.log(`   Error: ${result.error.message}`);
    }

    if (result.reason) {
      console.log(`   Reason: ${result.reason}`);
    }

    if (result.duration) {
      console.log(`   Duration: ${result.duration.toFixed(2)}ms`);
    }
  }

  // Print summary
  const applied = results.filter((r) => r.status === "applied").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const rolledBack = results.filter((r) => r.status === "rolled_back").length;

  console.log(
    `\nSummary: ${applied} applied, ${failed} failed, ${skipped} skipped, ${rolledBack} rolled back`,
  );
}

/**
 * Approves a dangerous migration for production
 */
async function approveMigration(migrationName: string) {
  const kv = await getKv();
  const isProduction = Deno.env.get("ENVIRONMENT") === "production" ||
    Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

  if (!isProduction) {
    console.log("This command is only relevant in production environments.");
    console.log(
      "In development, dangerous migrations can run without approval.",
    );
    return;
  }

  // Store approval in KV
  await kv.set(["db_meta", "migration_approvals", migrationName], {
    approved: true,
    timestamp: new Date().toISOString(),
    approver: Deno.env.get("USER") || "cli-user",
  });

  console.log(`Migration '${migrationName}' has been approved for production.`);
}

/**
 * Rolls back a specific migration
 */
function rollbackMigration(migrationName: string) {
  console.log(`Rolling back migration '${migrationName}'...`);

  // This is a simplified implementation. In a real-world scenario,
  // you would need to:
  // 1. Check if the migration exists
  // 2. Check if it's been applied
  // 3. Load the migration module
  // 4. Run the down() function
  // 5. Update the database to remove the migration record

  console.error("Migration rollback is not yet implemented.");
  Deno.exit(1);
}
