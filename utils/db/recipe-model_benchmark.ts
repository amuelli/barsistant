/// <reference lib="deno.unstable" />

import { recipeModel } from "./recipe-model.ts";
import { MeasurementUnit } from "../../types/ingredient.ts";
import { GlasswareType } from "../../types/recipe.ts";

/**
 * Benchmark to compare performance of different public recipe fetching approaches
 */

async function setupTestData(count: number) {
  console.log(`📝 Creating ${count} test recipes...`);
  const createdIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const recipe = await recipeModel.create({
      name: `Benchmark Recipe ${i}`,
      description: `Test recipe for benchmarking ${i}`,
      createdBy: "benchmark-user",
      visibility: "public",
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
    });
    createdIds.push(recipe.id);
  }

  return createdIds;
}

async function cleanupTestData(ids: string[]) {
  console.log("🧹 Cleaning up test data...");
  for (const id of ids) {
    const recipe = await recipeModel.getByIdForAdmin(id);
    if (recipe) {
      await recipeModel.deleteUserRecipe(recipe.createdBy, id);
    }
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

    // Benchmark public recipe fetching
    const start = performance.now();
    const results = await recipeModel.listPublicRecipes(limit);
    const end = performance.now();
    const time = end - start;

    // Display results
    console.log(
      `Public recipes: ${time.toFixed(2)}ms (${results.length} recipes)`,
    );

    console.log(`✅ Fetched ${results.length} public recipes`);
  }

  console.log("\n\n🎯 Benchmark complete!");

  // Cleanup
  await cleanupTestData(createdIds);
}

// Run the benchmark
if (import.meta.main) {
  await benchmarkPublicRecipes();
}
