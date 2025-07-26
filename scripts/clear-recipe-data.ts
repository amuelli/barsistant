#!/usr/bin/env -S deno run --allow-env --allow-net --unstable-kv

/**
 * Script to clear all recipe-related data from Deno KV
 *
 * This script removes both old and new data structures to start fresh
 * with the optimized storage format. Run this before using the new
 * recipe model implementation.
 *
 * Usage:
 *   deno run --allow-env --allow-net --unstable-kv scripts/clear-recipe-data.ts
 */

import { kv } from "../utils/db/db.ts";

async function main() {
  console.log("🧹 Clearing all recipe data from Deno KV...");
  console.log(
    "⚠️  This will delete ALL recipes, collections, and related data!",
  );

  // Confirm with user
  const confirmation = prompt("Are you sure? Type 'yes' to continue: ");
  if (confirmation !== "yes") {
    console.log("❌ Operation cancelled");
    Deno.exit(0);
  }

  try {
    // Clear all recipe-related data by deleting keys with known prefixes
    const prefixesToClear = [
      ["recipe"],
      ["user_recipes"],
      ["public_recipes"],
      ["user_favorites"],
      ["user_collections"],
      // Legacy indexes that may still exist (cleanup from old data structure)
      ["recipe_ingredient"],
      ["ingredient_recipes"],
      ["tag_recipes"],
      ["strength_recipes"],
      ["sweetness_recipes"],
    ];

    for (const prefix of prefixesToClear) {
      for await (const entry of kv.list({ prefix })) {
        await kv.delete(entry.key);
      }
    }

    console.log("✅ Successfully cleared all recipe data!");
    console.log("📊 You can now start fresh with the optimized data structure");
  } catch (error) {
    console.error("❌ Failed to clear recipe data:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
