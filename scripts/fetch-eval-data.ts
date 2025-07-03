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
import { fetchUrlContent, prepareHtmlForAI } from "../utils/url-content.ts";

// URLs and IDs for recipes to use in evaluation
const RECIPES = [
  {
    id: "mosquito-sam-ross",
    name: "Mosquito by Sam Ross",
    url:
      "https://www.diffordsguide.com/cocktails/recipe/32305/mosquito-by-sam-ross",
  },
  // Add more recipes here as needed for testing
];

async function fetchAndSaveEvalData() {
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

  // Process each recipe
  for (const recipe of RECIPES) {
    console.log(`\nFetching ${recipe.name} from ${recipe.url}...`);

    try {
      // Fetch raw HTML
      const { html, contentType } = await fetchUrlContent(recipe.url);
      console.log(`Fetched ${html.length} bytes of content (${contentType})`);

      // Process HTML with prepareHtmlForAI
      console.log("Processing HTML with prepareHtmlForAI...");
      const optimizedContent = prepareHtmlForAI(html);

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

      console.log(`Saved ${recipe.id} evaluation data:`);
      console.log(`  - Raw HTML: ${rawFilePath} (${html.length} bytes)`);
      console.log(
        `  - Processed HTML: ${processedFilePath} (${optimizedContent.length} bytes)`,
      );
      console.log(`  - Metadata: ${metaFilePath}`);
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

// Run the function if this file is executed directly
if (import.meta.main) {
  await fetchAndSaveEvalData();
}
