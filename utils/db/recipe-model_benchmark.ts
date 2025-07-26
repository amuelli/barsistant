/// <reference lib="deno.unstable" />

import { recipeModel } from "./recipe-model.ts";
import { MeasurementUnit } from "../../types/ingredient.ts";
import { GlasswareType } from "../../types/recipe.ts";

/**
 * Benchmark to compare performance of batch vs legacy public recipe fetching
 */

async function setupTestData(count: number) {
  console.log(`📝 Creating ${count} test recipes...`);
  const createdIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const recipe = await recipeModel.create({
      name: `Benchmark Recipe ${i}`,
      description: `Test recipe for benchmarking ${i}`,
      ingredients: [
        {
          ingredientId: `benchmark-ingredient-${i}`,
          name: `Benchmark Ingredient ${i}`,
          quantity: 50,
          unit: "ml" as MeasurementUnit,
          optional: false,
        },
      ],
      garnish: [],
      glassware: "rocks" as GlasswareType,
      preparation: ["Mix", "Serve"],
      source: { name: "Benchmark Test" },
      tags: ["benchmark"],
      visibility: "public", // All public for this test
    });
    createdIds.push(recipe.id);
  }

  return createdIds;
}

async function cleanupTestData(ids: string[]) {
  console.log("🧹 Cleaning up test data...");
  for (const id of ids) {
    await recipeModel.delete(id);
  }
}

async function benchmarkPublicRecipes() {
  console.log("🏁 Starting public recipe fetching benchmark...\n");

  // Create test data
  const testRecipeCount = 50;
  const createdIds = await setupTestData(testRecipeCount);

  // Allow KV to settle
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Test with different limits
  const limits = [12, 20, 50];

  for (const limit of limits) {
    console.log(`\n📊 Testing with limit=${limit}`);
    console.log("─".repeat(50));

    // Benchmark legacy method
    const legacyStart = performance.now();
    const legacyResults = await recipeModel.getPublicRecipes(limit);
    const legacyEnd = performance.now();
    const legacyTime = legacyEnd - legacyStart;

    // Benchmark batch method
    const batchStart = performance.now();
    const batchResults = await recipeModel.getPublicRecipesBatch(limit);
    const batchEnd = performance.now();
    const batchTime = batchEnd - batchStart;

    // Calculate improvement
    const improvement = ((legacyTime - batchTime) / legacyTime) * 100;
    const speedup = legacyTime / batchTime;

    // Display results
    console.log(
      `Legacy method: ${
        legacyTime.toFixed(2)
      }ms (${legacyResults.length} recipes)`,
    );
    console.log(
      `Batch method:  ${
        batchTime.toFixed(2)
      }ms (${batchResults.length} recipes)`,
    );
    console.log(`\n✨ Performance improvement: ${improvement.toFixed(1)}%`);
    console.log(`⚡ Speed up: ${speedup.toFixed(1)}x faster`);

    // Verify both methods return same results
    const legacyIds = new Set(legacyResults.map((r) => r.id));
    const batchIds = new Set(batchResults.map((r) => r.id));
    const sameResults = legacyIds.size === batchIds.size &&
      [...legacyIds].every((id) => batchIds.has(id));
    console.log(`✅ Results match: ${sameResults ? "Yes" : "No"}`);
  }

  console.log("\n\n🎯 Benchmark complete!");

  // Cleanup
  await cleanupTestData(createdIds);
}

// Run the benchmark
if (import.meta.main) {
  await benchmarkPublicRecipes();
}
