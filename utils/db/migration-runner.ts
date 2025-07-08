/**
 * Migration Runner Integration
 *
 * This module provides the integration between the migration system and
 * the Barsistant application startup flow.
 */

import { runMigrations } from "./migrations/index.ts";
import { MigrationOptions, MigrationResult } from "./migrations/types.ts";

/**
 * Runs migrations during application startup
 *
 * This function checks environment variables and applies migrations
 * based on the configuration. It should be called during app initialization.
 */
export async function runMigrationsOnStartup(): Promise<MigrationResult[]> {
  // Check if migrations are disabled
  const migrationsDisabled = Deno.env.get("DISABLE_MIGRATIONS") === "true";
  if (migrationsDisabled) {
    console.log(
      "[MIGRATION] Migrations are disabled via DISABLE_MIGRATIONS env var",
    );
    return [];
  }

  // Determine environment
  const isProduction = Deno.env.get("ENVIRONMENT") === "production" ||
    Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

  // Default migration options
  const options: MigrationOptions = {
    // In development, stop on error and try to rollback
    // In production, more cautious behavior is required
    stopOnError: true,
    rollbackOnError: !isProduction, // Only auto-rollback in non-prod

    // Default: only auto-migrate in development
    autoMigrate: !isProduction,

    // Never allow dangerous migrations in production unless explicitly approved
    allowDangerousMigrations: false,
  };

  // Override with environment variables if present
  if (Deno.env.get("AUTO_MIGRATE") === "true") {
    options.autoMigrate = true;
  } else if (Deno.env.get("AUTO_MIGRATE") === "false") {
    options.autoMigrate = false;
  }

  if (Deno.env.get("ROLLBACK_ON_ERROR") === "true") {
    options.rollbackOnError = true;
  } else if (Deno.env.get("ROLLBACK_ON_ERROR") === "false") {
    options.rollbackOnError = false;
  }

  // If auto-migrate is disabled, skip running migrations
  if (!options.autoMigrate) {
    console.log("[MIGRATION] Automatic migrations are disabled");
    return [];
  }

  console.log("[MIGRATION] Running database migrations on startup...");
  const results = await runMigrations(options);

  // Log results
  const applied = results.filter((r) => r.status === "applied").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const rolledBack = results.filter((r) => r.status === "rolled_back").length;

  console.log(
    `[MIGRATION] Migration summary: ${applied} applied, ${failed} failed, ${skipped} skipped, ${rolledBack} rolled back`,
  );

  return results;
}

/**
 * Exports the migration runner for CLI usage
 *
 * This function is used by CLI tools to run migrations manually
 */
export { runMigrations };
