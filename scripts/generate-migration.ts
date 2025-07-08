/**
 * Migration Generator CLI
 *
 * This script creates a new migration file with the correct naming convention
 * and basic structure. Run it with:
 *
 * ```
 * deno run -A scripts/generate-migration.ts my_migration_name "Description of migration"
 * ```
 */

import { join } from "@std/path";

// Migration name validation
const VALID_NAME_REGEX = /^[a-z0-9_]+$/;

// Parse command line arguments
const migrationName = Deno.args[0]?.toLowerCase();
const description = Deno.args.slice(1).join(" ") || "Add description here";

// Validate migration name
if (!migrationName) {
  console.error("Error: Migration name is required");
  console.log(
    'Usage: deno run -A scripts/generate-migration.ts my_migration_name "Description of migration"',
  );
  Deno.exit(1);
}

if (!VALID_NAME_REGEX.test(migrationName)) {
  console.error(
    "Error: Migration name must contain only lowercase letters, numbers, and underscores",
  );
  Deno.exit(1);
}

// Generate timestamp in YYYYMMDD_HHMMSS format
const now = new Date();
const timestamp = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0"),
  "_",
  String(now.getHours()).padStart(2, "0"),
  String(now.getMinutes()).padStart(2, "0"),
  String(now.getSeconds()).padStart(2, "0"),
].join("");

// Create filename
const filename = `${timestamp}_${migrationName}.ts`;
const templatePath = join(
  Deno.cwd(),
  "utils",
  "db",
  "migrations",
  "_template.ts",
);
const outputPath = join(Deno.cwd(), "utils", "db", "migrations", filename);

// Read template file
let templateContent: string;
try {
  templateContent = await Deno.readTextFile(templatePath);
} catch (error) {
  console.error(
    `Error reading template file: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  Deno.exit(1);
}

// Replace template placeholders
const content = templateContent
  .replace(/name: "migration_name"/g, `name: "${migrationName}"`)
  .replace(/timestamp: "YYYYMMDD_HHMMSS"/g, `timestamp: "${timestamp}"`)
  .replace(
    /description: "Description of what this migration does"/g,
    `description: "${description}"`,
  );

// Write new migration file
try {
  await Deno.writeTextFile(outputPath, content);
  console.log(`✅ Created new migration: ${filename}`);
  console.log(`Path: ${outputPath}`);
} catch (error) {
  console.error(
    `Error writing migration file: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  Deno.exit(1);
}
