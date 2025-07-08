#!/usr/bin/env -S deno run --allow-net --allow-write

/**
 * Recipe Extraction Script
 *
 * This script calls the extraction endpoint on https://barsistant.deno.dev/
 * for all URLs defined in the data.ts file.
 *
 * Usage:
 * deno run --allow-net --allow-write scripts/extract-recipes.ts
 */

import { recipeUrls } from "./data.ts";

// Configuration
const EXTRACTION_API_URL = "https://barsistant.deno.dev/api/extract";
const DELAY_BETWEEN_REQUESTS_MS = 1000;

/**
 * Response format from the extraction API
 */
interface ExtractResponse {
  success: boolean;
  recipeId?: string;
  id?: string;
  name?: string;
  error?: string;
}

/**
 * Result of an extraction attempt
 */
interface ExtractResult {
  url: string;
  success: boolean;
  recipeId?: string;
  name?: string;
  error?: string;
}

/**
 * Extracts a recipe from a URL using the Barsistant API
 */
async function extractRecipe(url: string): Promise<ExtractResult> {
  console.log(`🍸 Extracting recipe from: ${url}`);

  try {
    const response = await fetch(EXTRACTION_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json() as ExtractResponse;

    if (!response.ok) {
      return {
        url,
        success: false,
        error: data.error ||
          `HTTP error ${response.status}: ${response.statusText}`,
      };
    }

    return {
      url,
      success: true,
      recipeId: data.recipeId || data.id,
      name: data.name,
    };
  } catch (error) {
    return {
      url,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main function to extract all recipes
 */
async function extractAllRecipes() {
  console.log(`🚀 Starting extraction of ${recipeUrls.length} recipes...\n`);

  const results: Record<string, ExtractResult> = {};
  let successCount = 0;
  let failCount = 0;

  for (const url of recipeUrls) {
    const result = await extractRecipe(url);
    results[url] = result;

    if (result.success) {
      successCount++;
      console.log(
        `✅ Success: ${
          result.name || "Unknown recipe"
        } (ID: ${result.recipeId})`,
      );
    } else {
      failCount++;
      console.log(`❌ Failed: ${url} - Error: ${result.error}`);
    }

    console.log(""); // Add empty line for better readability

    // Add a small delay to avoid overwhelming the API
    if (recipeUrls.indexOf(url) < recipeUrls.length - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_REQUESTS_MS)
      );
    }
  }

  console.log("\n📊 Extraction Summary");
  console.log(`Total URLs: ${recipeUrls.length}`);
  console.log(`✅ Successful extractions: ${successCount}`);
  console.log(`❌ Failed extractions: ${failCount}`);

  // Save the results to a file
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputPath = `./extraction-results-${timestamp}.json`;

  try {
    await Deno.writeTextFile(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to save results: ${errorMessage}`);
  }
}

// Run the extraction if this is the main module
if (import.meta.main) {
  await extractAllRecipes();
}
