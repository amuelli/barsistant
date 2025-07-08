/**
 * Migration Registry and Runner
 *
 * This module provides functionality to discover, track, and run database migrations
 * for the Barsistant application.
 */

import { getKv } from "../db.ts";
import type {
  Migration,
  MigrationMetaKey,
  MigrationOptions,
  MigrationRecord,
  MigrationResult,
  MigrationStatus,
} from "./types.ts";

/**
 * Error class for migration errors
 */
export class MigrationError extends Error {
  constructor(
    message: string,
    public readonly migrationName: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "MigrationError";
  }
}

/**
 * Pattern for identifying migration files
 * Format: YYYYMMDD_HHMMSS_migration_name.ts
 */
const MIGRATION_FILE_PATTERN = /^(\d{8}_\d{6})_(.+)\.ts$/;

/**
 * Extracts migration metadata from filename
 */
export function extractMigrationMetadata(
  filename: string,
): { timestamp: string; name: string } | null {
  const match = filename.match(MIGRATION_FILE_PATTERN);
  if (!match) return null;

  const [, timestamp, name] = match;
  return { timestamp, name };
}

/**
 * Discovers all available migrations from the migrations directory
 */
export async function discoverMigrations(): Promise<Migration[]> {
  const migrations: Migration[] = [];

  try {
    // Get all .ts files in the migrations directory (excluding _template.ts)
    for await (const dirEntry of Deno.readDir(new URL(".", import.meta.url))) {
      if (
        !dirEntry.isFile || !dirEntry.name.endsWith(".ts") ||
        dirEntry.name === "_template.ts" || dirEntry.name === "types.ts" ||
        dirEntry.name === "index.ts"
      ) {
        continue;
      }

      // Extract metadata from filename
      const metadata = extractMigrationMetadata(dirEntry.name);
      if (!metadata) {
        console.warn(
          `Ignoring file with invalid migration naming pattern: ${dirEntry.name}`,
        );
        continue;
      }

      // Import migration dynamically
      try {
        const module = await import(`./${dirEntry.name}`);
        const migration: Migration = module.default || module.migration;

        if (
          !migration || typeof migration.up !== "function" ||
          typeof migration.down !== "function"
        ) {
          console.warn(
            `Ignoring file without valid migration exports: ${dirEntry.name}`,
          );
          continue;
        }

        // Apply metadata from filename if not explicitly set in migration
        if (!migration.name || migration.name === "migration_name") {
          migration.name = metadata.name;
        }

        if (!migration.timestamp || migration.timestamp === "YYYYMMDD_HHMMSS") {
          migration.timestamp = metadata.timestamp;
        }

        migrations.push(migration);
      } catch (error) {
        console.error(`Error importing migration ${dirEntry.name}:`, error);
      }
    }

    // Sort migrations by timestamp
    return migrations.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  } catch (error) {
    console.error("Error discovering migrations:", error);
    return [];
  }
}

/**
 * Gets the list of applied migrations from the database
 */
export async function getAppliedMigrations(): Promise<string[]> {
  const kv = await getKv();
  const migrationsPrefix: [string, string] = ["db_meta", "migrations"];

  const appliedMigrations: string[] = [];

  // Get all entries with the migrations prefix
  const entries = kv.list<MigrationRecord>({ prefix: migrationsPrefix });

  for await (const entry of entries) {
    if (entry.value) {
      appliedMigrations.push(entry.value.name);
    }
  }

  return appliedMigrations;
}

/**
 * Records a successful migration in the database
 */
export async function recordMigrationSuccess(
  migration: Migration,
  durationMs?: number,
): Promise<void> {
  const kv = await getKv();
  const key: MigrationMetaKey = ["db_meta", "migrations", migration.name];

  const record: MigrationRecord = {
    name: migration.name,
    timestamp: migration.timestamp,
    appliedAt: new Date().toISOString(),
    duration: durationMs,
  };

  await kv.set(key, record);
}

/**
 * Records a failed migration in the database
 */
export async function recordMigrationFailure(
  migration: Migration,
  error: Error,
): Promise<void> {
  const kv = await getKv();
  const key: MigrationMetaKey = [
    "db_meta",
    "migrations",
    `failed_${migration.name}`,
  ];

  await kv.set(key, {
    name: migration.name,
    timestamp: migration.timestamp,
    error: error.message,
    failedAt: new Date().toISOString(),
  });
}

/**
 * Checks if a dangerous migration is approved to run in production
 */
export function isDangerousMigrationApproved(migrationName: string): boolean {
  const isProduction = Deno.env.get("ENVIRONMENT") === "production" ||
    Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

  if (!isProduction) {
    // In non-production environments, allow dangerous migrations
    return true;
  }

  // In production, check for specific approval
  const approvedMigrations = Deno.env.get("APPROVED_DANGEROUS_MIGRATIONS");
  if (!approvedMigrations) {
    console.warn(
      `Dangerous migration '${migrationName}' blocked in production. Set APPROVED_DANGEROUS_MIGRATIONS env var to approve.`,
    );
    return false;
  }

  // Check if this specific migration is approved
  const approved = approvedMigrations.split(",").includes(migrationName);
  if (!approved) {
    console.warn(
      `Dangerous migration '${migrationName}' not found in APPROVED_DANGEROUS_MIGRATIONS list.`,
    );
  }

  return approved;
}

/**
 * Runs pending migrations with safety checks
 */
export async function runMigrations(
  options: MigrationOptions = {},
): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];
  const migrations = await discoverMigrations();
  const appliedMigrations = await getAppliedMigrations();

  for (const migration of migrations) {
    // Skip already applied migrations
    if (appliedMigrations.includes(migration.name)) {
      continue;
    }

    // Check if dangerous migration is approved for production
    if (migration.isDangerous) {
      const approved = await isDangerousMigrationApproved(migration.name);
      if (!approved) {
        results.push({
          name: migration.name,
          status: "skipped",
          reason: "Dangerous migration not approved for production",
        });
        continue;
      }
    }

    // Log the migration that's about to run
    console.log(
      `[MIGRATION] Running migration: ${migration.name} (${migration.description})`,
    );

    // Skip actual execution if in dry run mode
    if (options.dryRun) {
      console.log(
        `[MIGRATION] DRY RUN: Would apply migration '${migration.name}'`,
      );
      results.push({
        name: migration.name,
        status: "skipped",
        reason: "Dry run mode",
      });
      continue;
    }

    // Execute the migration
    const startTime = performance.now();
    try {
      await migration.up();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Record successful migration
      await recordMigrationSuccess(migration, duration);

      results.push({
        name: migration.name,
        status: "applied",
        appliedAt: new Date().toISOString(),
        duration,
      });

      console.log(
        `[MIGRATION] Successfully applied migration '${migration.name}' in ${
          duration.toFixed(2)
        }ms`,
      );
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.error(
        `[MIGRATION] Failed to apply migration '${migration.name}':`,
        error,
      );

      // Record failure
      await recordMigrationFailure(
        migration,
        error instanceof Error ? error : new Error(String(error)),
      );

      // Attempt rollback if enabled
      if (options.rollbackOnError !== false) {
        try {
          console.log(
            `[MIGRATION] Attempting to roll back failed migration '${migration.name}'`,
          );
          await migration.down();
          console.log(
            `[MIGRATION] Successfully rolled back migration '${migration.name}'`,
          );

          results.push({
            name: migration.name,
            status: "rolled_back",
            error: error instanceof Error ? error : new Error(String(error)),
            duration,
          });
        } catch (rollbackError) {
          console.error(
            `[MIGRATION] Failed to roll back migration '${migration.name}':`,
            rollbackError,
          );

          results.push({
            name: migration.name,
            status: "failed",
            error: new MigrationError(
              `Migration failed and rollback also failed: ${
                rollbackError instanceof Error
                  ? rollbackError.message
                  : String(rollbackError)
              }`,
              migration.name,
              error,
            ),
            duration,
          });
        }
      } else {
        results.push({
          name: migration.name,
          status: "failed",
          error: error instanceof Error ? error : new Error(String(error)),
          duration,
        });
      }

      // If stopOnError is true, abort further migrations
      if (options.stopOnError !== false) {
        break;
      }
    }
  }

  return results;
}

/**
 * Gets the status of all migrations (applied and pending)
 */
export async function getMigrationStatus(): Promise<
  Array<{ name: string; status: MigrationStatus; appliedAt?: string }>
> {
  const migrations = await discoverMigrations();
  const appliedMigrations = await getAppliedMigrations();

  return migrations.map((migration) => {
    const isApplied = appliedMigrations.includes(migration.name);

    return {
      name: migration.name,
      status: isApplied ? "applied" : "pending",
    };
  });
}
