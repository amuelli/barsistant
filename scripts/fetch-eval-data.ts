/**
 * Fetches evaluation data for recipe extraction testing
 *
 * This script fetches HTML content from recipe URLs, processes it with prepareHtmlForAI,
 * and saves the prepared content to the eval-data directory for consistent testing.
 *
 * Usage:
 * deno run -A scripts/fetch-eval-data.ts
 */

import "@std/dotenv/load";
import { type RecipeExtraction } from "🛠️/ai/extraction.ts";
import {
  type RecipeTestCase,
  TEST_CASES,
} from "🛠️/ai/extraction_eval_test_cases.ts";
import { fetchUrlContent, prepareHtmlForAI } from "🛠️/url-content.ts";

// For backward compatibility, alias TEST_CASES as RECIPES
export { TEST_CASES as RECIPES };

/**
 * Template for creating an expected extraction JSON file
 * This provides a starting point for test case expected results
 */
function createEmptyExtractionTemplate(): RecipeExtraction {
  return {
    title: "",
    description: "",
    ingredients: [
      {
        name: "",
        quantity: 0,
        unit: "oz" as const,
        optional: false,
        type: "spirit" as const,
        notes: "",
      },
    ],
    instructions: [""],
    garnish: [""],
    glassware: "old-fashioned" as const,
    category: [""],
    source: {
      url: "",
      name: "",
      author: "",
    },
  };
}

/**
 * Fetches and saves evaluation data for recipe extraction testing
 * @param overrideRecipes Optional array of recipes to process instead of the default RECIPES
 */
export async function fetchAndSaveEvalData(overrideRecipes?: RecipeTestCase[]) {
  console.log("Fetching evaluation data for recipe extraction...");

  // Ensure eval-data directory exists
  const evalDataDir = "./eval-data";
  try {
    await Deno.mkdir(evalDataDir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }

  // Use override recipes if provided
  const recipesToProcess = overrideRecipes || TEST_CASES;

  // Process each recipe
  for (const recipe of recipesToProcess) {
    console.log(`\nFetching ${recipe.name} from ${recipe.url}...`);

    try {
      // Fetch raw HTML
      const { html, contentType } = await fetchUrlContent(recipe.url);
      console.log(`Fetched ${html.length} bytes of content (${contentType})`);

      // Process HTML with prepareHtmlForAI
      console.log("Processing HTML with prepareHtmlForAI...");
      const optimizedContent = prepareHtmlForAI(html, recipe.url);

      if (!optimizedContent) {
        console.error(`Failed to prepare HTML for ${recipe.id}`);
        continue;
      }

      console.log(`Optimized content is ${optimizedContent.length} bytes`);

      // Save original and processed content to files
      const rawFilePath = `${evalDataDir}/${recipe.id}-raw.html`;
      const processedFilePath = `${evalDataDir}/${recipe.id}-processed.html`;

      await Deno.writeTextFile(rawFilePath, html);
      await Deno.writeTextFile(processedFilePath, optimizedContent);

      // Create a JSON file with metadata about the recipe
      const metaFilePath = `${evalDataDir}/${recipe.id}-meta.json`;
      const metadata = {
        id: recipe.id,
        name: recipe.name,
        url: recipe.url,
        fetchDate: new Date().toISOString(),
        rawSizeBytes: html.length,
        processedSizeBytes: optimizedContent.length,
      };

      await Deno.writeTextFile(metaFilePath, JSON.stringify(metadata, null, 2));

      // Create an expected extraction template file if it doesn't exist
      const expectedFilePath = `${evalDataDir}/${recipe.id}-expected.json`;
      try {
        await Deno.stat(expectedFilePath);
        console.log(
          `Expected extraction file already exists: ${expectedFilePath}`,
        );
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          console.log(
            `Creating expected extraction template: ${expectedFilePath}`,
          );
          const template = createEmptyExtractionTemplate();
          // Pre-fill some fields
          template.title = recipe.name.replace(" by Sam Ross", "").replace(
            " Classic",
            "",
          );
          template.source.url = recipe.url;
          template.source.name = recipe.url.includes("diffordsguide")
            ? "Difford's Guide"
            : "";

          await Deno.writeTextFile(
            expectedFilePath,
            JSON.stringify(template, null, 2),
          );
        } else {
          throw error;
        }
      }

      console.log(`Saved ${recipe.id} evaluation data:`);
      console.log(`  - Raw HTML: ${rawFilePath} (${html.length} bytes)`);
      console.log(
        `  - Processed HTML: ${processedFilePath} (${optimizedContent.length} bytes)`,
      );
      console.log(`  - Metadata: ${metaFilePath}`);
      console.log(`  - Expected extraction template: ${expectedFilePath}`);
    } catch (error) {
      console.error(`Failed to process ${recipe.name}:`, error);
    }
  }

  console.log("\nEvaluation data fetching completed.");
}

// Run the function if this file is executed directly
if (import.meta.main) {
  await fetchAndSaveEvalData();
}
