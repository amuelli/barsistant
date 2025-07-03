/**
 * Utility script to generate expected extraction JSON files from current extraction output
 *
 * This script runs the extraction on a test case and saves the result as an expected.json file,
 * which can then be manually reviewed and edited as needed.
 *
 * Usage:
 * deno run -A scripts/generate-expected-extraction.ts <recipe-id>
 * Example: deno run -A scripts/generate-expected-extraction.ts mosquito-sam-ross
 */

import "@std/dotenv/load";
import { extractRecipeFromContent } from "../utils/ai/extraction.ts";

// Get recipe ID from command line args
const recipeId = Deno.args[0];
if (!recipeId) {
  console.error("Please provide a recipe ID as an argument");
  console.error(
    "Example: deno run -A scripts/generate-expected-extraction.ts mosquito-sam-ross",
  );
  Deno.exit(1);
}

async function generateExpectedExtraction(id: string) {
  console.log(`Generating expected extraction for recipe ID: ${id}`);

  // Check if the required files exist
  const processedHtmlPath = `./eval-data/${id}-processed.html`;
  const metaFilePath = `./eval-data/${id}-meta.json`;
  const expectedFilePath = `./eval-data/${id}-expected.json`;

  try {
    // Check if processed HTML exists
    await Deno.stat(processedHtmlPath);

    // Read metadata to get the URL
    const metaText = await Deno.readTextFile(metaFilePath);
    const meta = JSON.parse(metaText);
    const url = meta.url;

    // Read the processed HTML
    console.log(`Reading processed HTML from ${processedHtmlPath}...`);
    const processedHtml = await Deno.readTextFile(processedHtmlPath);

    // Run the extraction
    console.log("Running extraction...");
    console.time("Extraction time");
    const extracted = await extractRecipeFromContent(processedHtml, url);
    console.timeEnd("Extraction time");

    console.log("\nExtracted Recipe:");
    console.log(JSON.stringify(extracted, null, 2));

    // Check if the expected file already exists
    try {
      await Deno.stat(expectedFilePath);
      // Using prompt to get user confirmation
      const answer = prompt(
        `File ${expectedFilePath} already exists. Overwrite? (y/n)`,
      );
      if (answer?.toLowerCase() !== "y") {
        console.log("Operation cancelled.");
        return;
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }

    // Write the extracted data as the expected extraction
    await Deno.writeTextFile(
      expectedFilePath,
      JSON.stringify(extracted, null, 2),
    );
    console.log(`\nSaved expected extraction to ${expectedFilePath}`);
    console.log(
      "Review and edit this file as needed to establish the correct expected values.",
    );
    console.log(
      "\nRemember to add or update this test case in the TEST_CASES array",
    );
    console.log("in utils/ai/test-cases.ts if it's not already there.");
  } catch (error) {
    console.error(`Failed to generate expected extraction:`, error);

    if (error instanceof Deno.errors.NotFound) {
      console.error(
        `\nPlease run 'deno run -A scripts/fetch-eval-data.ts' first to fetch the evaluation data.`,
      );
    }
  }
}

if (import.meta.main) {
  await generateExpectedExtraction(recipeId);
}
