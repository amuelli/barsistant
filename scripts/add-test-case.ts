/**
 * Utility script to add a new recipe test case for extraction evaluation
 *
 * This script adds a new recipe test case, fetches the data,
 * and prepares the test data for evaluation.
 *
 * Usage:
 * deno run -A scripts/add-test-case.ts <id> <name> <url>
 *
 * Example:
 * deno run -A scripts/add-test-case.ts negroni-classic "Classic Negroni" https://www.diffordsguide.com/cocktails/recipe/1204/negroni
 */

import { type RecipeTestCase } from "🛠️/ai/extraction_eval_test_cases.ts";
import { fetchAndSaveEvalData } from "./fetch-eval-data.ts";

// Check command line arguments
if (Deno.args.length < 3) {
  console.error("Please provide all required arguments: id, name, and url");
  console.error(
    'Example: deno run -A scripts/add-test-case.ts negroni-classic "Classic Negroni" https://www.diffordsguide.com/cocktails/recipe/1204/negroni',
  );
  Deno.exit(1);
}

const [id, name, url] = Deno.args;

// Validate inputs
if (!id || !name || !url) {
  console.error("All arguments must be non-empty strings");
  Deno.exit(1);
}

if (!url.startsWith("http")) {
  console.error("URL must start with http:// or https://");
  Deno.exit(1);
}

if (id.includes(" ") || id.includes("/") || id.includes("\\")) {
  console.error("ID must not contain spaces or slashes");
  Deno.exit(1);
}

// Create the new recipe entry
const newRecipe: RecipeTestCase = { id, name, url };

async function addTestCase() {
  console.log(`Adding new test case: ${name} (${id})`);
  console.log(`URL: ${url}`);

  // Check if files for this ID already exist
  const evalDataDir = "./eval-data";
  const basePath = `${evalDataDir}/${id}`;

  try {
    // Check for existing files with this ID
    const filesToCheck = [
      `${basePath}-raw.html`,
      `${basePath}-processed.html`,
      `${basePath}-meta.json`,
      `${basePath}-expected.json`,
    ];

    let filesExist = false;
    for (const file of filesToCheck) {
      try {
        await Deno.stat(file);
        filesExist = true;
        break;
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }
      }
    }

    if (filesExist) {
      console.error(`Error: Files for test case '${id}' already exist.`);
      console.error(
        `If you want to recreate this test case, delete the files first:`,
      );
      for (const file of filesToCheck) {
        console.error(`- ${file}`);
      }
      Deno.exit(1);
    }

    console.log("\nFetching recipe data...");

    // Run the fetch and save function with just our new recipe
    await fetchAndSaveEvalData([newRecipe]);

    console.log(`\nNext steps:`);
    console.log(`1. Review the generated expected extraction template`);
    console.log(`   at ${basePath}-expected.json`);
    console.log(`2. Fill in the expected values or use:`);
    console.log(`   deno run -A scripts/generate-expected-extraction.ts ${id}`);

    // Now the test cases are in a shared file, so no need to manually update them
    console.log(
      `3. Your test case will be automatically used by the evaluation script`,
    );

    // Update the test-cases.ts file to add the new test case
    await updateTestCasesFile(newRecipe);
  } catch (error) {
    console.error("Failed to add test case:", error);
  }
}

/**
 * Updates the test-cases.ts file to add the new test case
 */
async function updateTestCasesFile(newRecipe: RecipeTestCase) {
  const filePath = "./utils/ai/test-cases.ts";

  try {
    // Read the file
    const content = await Deno.readTextFile(filePath);

    // Find the end of the TEST_CASES array (before the closing '];')
    const arrayEndIndex = content.lastIndexOf("];");
    if (arrayEndIndex === -1) {
      throw new Error(
        "Could not find the end of TEST_CASES array in test-cases.ts",
      );
    }

    // Generate the new test case entry with proper indentation
    const newEntry = `  {
    id: "${newRecipe.id}",
    name: "${newRecipe.name}",
    url: "${newRecipe.url}",
  },\n`;

    // Insert the new entry before the array closing
    const updatedContent = content.substring(0, arrayEndIndex - 2) + // Before last test case closing bracket
      (content.substring(arrayEndIndex - 2, arrayEndIndex).trim()
        ? ",\n"
        : "") + // Add comma if needed
      newEntry +
      content.substring(arrayEndIndex - 2); // The rest of file including closing bracket

    // Write back the updated file
    await Deno.writeTextFile(filePath, updatedContent);
    console.log(`4. Added test case to ${filePath}`);
  } catch (error) {
    console.error(`Failed to update ${filePath}:`, error);
    console.error("You will need to manually add the test case to this file.");
  }
}

if (import.meta.main) {
  await addTestCase();
}
