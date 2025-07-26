#!/usr/bin/env -S deno run --allow-all
/// <reference lib="deno.unstable" />

/**
 * KV Store Dump Script
 *
 * This script dumps the entire contents of the Deno KV store
 * for debugging and inspection purposes.
 */

import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { kv } from "🛠️/db/db.ts";

interface DumpOptions {
  format: "json" | "table" | "raw";
  prefix?: string[];
  limit?: number;
  output?: string;
}

/**
 * Format a key for display
 */
function formatKey(key: Deno.KvKey): string {
  return key.map((part) => {
    if (typeof part === "string") return `"${part}"`;
    if (typeof part === "number") return part.toString();
    if (typeof part === "boolean") return part.toString();
    if (part instanceof Uint8Array) return `Uint8Array(${part.length})`;
    return JSON.stringify(part);
  }).join(", ");
}

/**
 * Format a value for display
 */
function formatValue(value: unknown, format: string): string {
  if (format === "raw") {
    return JSON.stringify(value, null, 2);
  }

  if (value === null || value === undefined) {
    return String(value);
  }

  if (typeof value === "object") {
    // Truncate large objects for table format
    const str = JSON.stringify(value);
    if (format === "table" && str.length > 100) {
      return str.substring(0, 97) + "...";
    }
    return str;
  }

  return String(value);
}

/**
 * Dump KV store contents
 */
async function dumpKv(options: DumpOptions): Promise<void> {
  console.log("🔍 Dumping KV Store Contents");
  console.log("=".repeat(50));

  if (options.prefix) {
    console.log(`📍 Prefix filter: [${formatKey(options.prefix)}]`);
  }

  const entries: { key: Deno.KvKey; value: unknown }[] = [];

  let count = 0;

  if (options.prefix) {
    // Use specific prefix
    const listOptions: { prefix: Deno.KvKey; limit?: number } = {
      prefix: options.prefix,
    };
    if (options.limit) listOptions.limit = options.limit;

    for await (const entry of kv.list(listOptions)) {
      entries.push({ key: entry.key, value: entry.value });
      count++;

      if (options.limit && count >= options.limit) {
        break;
      }
    }
  } else {
    // List all entries by iterating through common prefixes
    const commonPrefixes = [
      "user_recipe",
      "public_recipe",
      "ingredient",
      "user",
      "user_favorites",
      "user_inventory",
      "user_notes",
      "user_collections",
      "auth_tokens",
      "user_sessions",
      "user_emails",
      "db_meta",
    ];

    for (const prefix of commonPrefixes) {
      for await (const entry of kv.list({ prefix: [prefix] })) {
        entries.push({ key: entry.key, value: entry.value });
        count++;

        if (options.limit && count >= options.limit) {
          break;
        }
      }

      if (options.limit && count >= options.limit) {
        break;
      }
    }
  }

  // If no entries found and no prefix specified, try listing with empty prefix array
  if (entries.length === 0 && !options.prefix) {
    try {
      for await (const entry of kv.list({ prefix: [] })) {
        entries.push({ key: entry.key, value: entry.value });
        count++;

        if (options.limit && count >= options.limit) {
          break;
        }
      }
    } catch (error) {
      console.warn(
        `⚠️  Could not list with empty prefix: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  console.log(`📊 Found ${entries.length} entries\n`);

  if (entries.length === 0) {
    console.log("💭 No entries found");
    return;
  }

  // Group entries by key prefix for better organization
  const grouped = new Map<string, typeof entries>();

  for (const entry of entries) {
    const prefix = entry.key[0]?.toString() || "unknown";
    if (!grouped.has(prefix)) {
      grouped.set(prefix, []);
    }
    grouped.get(prefix)!.push(entry);
  }

  // Sort groups alphabetically
  const sortedGroups = Array.from(grouped.entries()).sort();

  if (options.format === "json") {
    const output = Object.fromEntries(
      entries.map((entry) => [formatKey(entry.key), entry.value]),
    );

    const jsonStr = JSON.stringify(output, null, 2);

    if (options.output) {
      await Deno.writeTextFile(options.output, jsonStr);
      console.log(`💾 JSON output written to: ${options.output}`);
    } else {
      console.log(jsonStr);
    }
    return;
  }

  // Table or raw format
  for (const [groupName, groupEntries] of sortedGroups) {
    console.log(
      `\n🏷️  ${groupName.toUpperCase()} (${groupEntries.length} entries)`,
    );
    console.log("-".repeat(50));

    if (options.format === "table") {
      // Simple table format
      for (const entry of groupEntries) {
        const keyStr = formatKey(entry.key);
        const valueStr = formatValue(entry.value, "table");
        console.log(`  Key: [${keyStr}]`);
        console.log(`  Val: ${valueStr}`);
        console.log();
      }
    } else {
      // Raw format
      for (const entry of groupEntries) {
        console.log(`Key: [${formatKey(entry.key)}]`);
        console.log(`Value:`);
        console.log(formatValue(entry.value, "raw"));
        console.log("-".repeat(30));
      }
    }
  }

  console.log(`\n✅ Dump complete - ${entries.length} total entries`);
}

/**
 * Parse command line arguments
 */
function parseArgs(): DumpOptions {
  const args = Deno.args;
  const options: DumpOptions = {
    format: "table",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--format":
      case "-f": {
        const format = args[++i];
        if (!["json", "table", "raw"].includes(format)) {
          throw new Error(`Invalid format: ${format}. Use json, table, or raw`);
        }
        options.format = format as "json" | "table" | "raw";
        break;
      }

      case "--prefix":
      case "-p": {
        const prefixStr = args[++i];
        try {
          options.prefix = JSON.parse(`[${prefixStr}]`);
        } catch {
          // If JSON parsing fails, treat as string prefix
          options.prefix = [prefixStr];
        }
        break;
      }

      case "--limit":
      case "-l":
        options.limit = parseInt(args[++i]);
        break;

      case "--output":
      case "-o":
        options.output = args[++i];
        break;

      case "--help":
      case "-h":
        printHelp();
        Deno.exit(0);
        break;

      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}`);
          printHelp();
          Deno.exit(1);
        }
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
KV Store Dump Script

Usage: deno run --allow-all scripts/dump-kv.ts [options]

Options:
  -f, --format <format>     Output format: json, table, raw (default: table)
  -p, --prefix <prefix>     Filter by key prefix (e.g., "user_recipe" or '"user_recipe","user123"')
  -l, --limit <number>      Limit number of entries to dump
  -o, --output <file>       Write JSON output to file (only for json format)
  -h, --help               Show this help message

Examples:
  # Dump all entries in table format
  deno run --allow-all scripts/dump-kv.ts

  # Dump only user recipes
  deno run --allow-all scripts/dump-kv.ts --prefix "user_recipe"

  # Dump specific user's recipes
  deno run --allow-all scripts/dump-kv.ts --prefix '"user_recipe","user123"'

  # Export all data as JSON
  deno run --allow-all scripts/dump-kv.ts --format json --output kv-dump.json

  # Dump first 10 entries in raw format
  deno run --allow-all scripts/dump-kv.ts --format raw --limit 10
`);
}

// Main execution
if (import.meta.main) {
  try {
    const options = parseArgs();
    await dumpKv(options);
  } catch (error) {
    console.error(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    Deno.exit(1);
  }
}
