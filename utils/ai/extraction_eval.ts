/**
 * Evaluation script for the recipe extraction pipeline
 *
 * This script tests the extraction pipeline using preprocessed real-world cocktail recipes
 * from the eval-data directory and outputs the structured result for verification.
 */

import {
  extractRecipeFromContent,
  type RecipeExtraction,
} from "./extraction.ts";

// URL for the Mosquito cocktail by Sam Ross on Difford's Guide
const MOSQUITO_URL =
  "https://www.diffordsguide.com/cocktails/recipe/32305/mosquito-by-sam-ross";

// Path to the pre-processed HTML file for evaluation
const MOSQUITO_PROCESSED_HTML_PATH =
  "./eval-data/mosquito-sam-ross-processed.html";

/**
 * Expected extraction result for comparison
 * This helps validate that the extraction is working correctly
 */
const EXPECTED_EXTRACTION: RecipeExtraction = {
  title: "Mosquito",
  description:
    "Sweet 'n' Sour and bittersweet cocktail with fiery ginger spice, created by Sam Ross at Attaboy bar in Manhattan.",
  ingredients: [
    {
      name: "Mezcal",
      quantity: 22.5,
      unit: "ml",
      optional: false,
      type: "spirit",
      notes: "Del Maguey Vida Clásico recommended",
    },
    {
      name: "Red Bitter Liqueur",
      quantity: 22.5,
      unit: "ml",
      optional: false,
      type: "liqueur",
      notes: "Strucchi or Campari-style",
    },
    {
      name: "Lemon juice",
      quantity: 22.5,
      unit: "ml",
      optional: false,
      type: "juice",
      notes: "Freshly squeezed",
    },
    {
      name: "Ginger syrup",
      quantity: 22.5,
      unit: "ml",
      optional: false,
      type: "syrup",
      notes: "Equal parts ginger juice to caster sugar by weight",
    },
    {
      name: "Saline solution",
      quantity: 3,
      unit: "drop",
      optional: false,
      type: "other",
      notes: "4:1 (20g sea salt to 80g water)",
    },
  ],
  instructions: [
    "Select and pre-chill a Coupe glass.",
    "Prepare garnish of skewered crystallised ginger.",
    "SHAKE all ingredients with ice.",
    "FINE STRAIN into chilled glass.",
    "Garnish with skewered crystallised ginger.",
  ],
  garnish: ["Skewered crystallised ginger"],
  glassware: "coupe",
  category: ["aperitivo", "spicy"],
  source: {
    url:
      "https://www.diffordsguide.com/cocktails/recipe/32305/mosquito-by-sam-ross",
    name: "Difford's Guide",
    author: "Sam Ross",
  },
};

/**
 * Runs the extraction on the Mosquito recipe using pre-processed HTML data
 */
export async function evaluateExtraction(): Promise<void> {
  console.log("Evaluating recipe extraction pipeline...");
  console.log("Recipe: Mosquito by Sam Ross");
  console.log("Using pre-processed HTML from evaluation data");

  try {
    console.time("Extraction time");

    // Read pre-processed HTML from eval-data directory
    console.log(
      `Reading pre-processed HTML from ${MOSQUITO_PROCESSED_HTML_PATH}...`,
    );

    // Read the pre-processed HTML from the file
    const optimizedContent = await Deno.readTextFile(
      MOSQUITO_PROCESSED_HTML_PATH,
    );
    console.log(
      `Loaded ${optimizedContent.length} bytes of pre-processed content`,
    );

    // Extract recipe using the same function as production
    console.log("Extracting recipe with AI...");
    const extracted = await extractRecipeFromContent(
      optimizedContent,
      MOSQUITO_URL,
    );

    console.timeEnd("Extraction time");

    console.log("\nExtracted Recipe:");
    console.log(JSON.stringify(extracted, null, 2));

    // Validate that the extraction matches our expectations
    const evaluation = evaluateExtractionQuality(extracted);
    console.log("\nEvaluation Results:");
    console.log(evaluation);

    return;
  } catch (error) {
    console.error("Extraction failed:", error);
  }
}

/**
 * Evaluates the quality of extraction by comparing to expected values
 *
 * @param extracted The extracted recipe
 * @returns An evaluation summary object
 */
function evaluateExtractionQuality(extracted: RecipeExtraction) {
  // Create an evaluation results object
  const results = {
    titleMatch: extracted.title.includes("Mosquito"),
    ingredientCount: {
      expected: EXPECTED_EXTRACTION.ingredients.length,
      actual: extracted.ingredients.length,
      correct:
        EXPECTED_EXTRACTION.ingredients.length === extracted.ingredients.length,
    },
    // Check if mezcal was properly generalized (moved specific brand to notes)
    mezcalNormalization: {
      correct: false,
      details: "",
    },
    // Check if red bitter was properly generalized
    redBitterNormalization: {
      correct: false,
      details: "",
    },
    instructionsMatch: {
      expected: EXPECTED_EXTRACTION.instructions.length,
      actual: extracted.instructions.length,
      correct: EXPECTED_EXTRACTION.instructions.length ===
        extracted.instructions.length,
    },
    glasswareMatch: extracted.glassware === EXPECTED_EXTRACTION.glassware,
    overallScore: 0, // Will be calculated below
  };

  // Check Mezcal normalization - should be generic name with brand in notes
  const mezcal = extracted.ingredients.find((i) =>
    i.name.toLowerCase().includes("mezcal") ||
    (i.notes?.toLowerCase().includes("mezcal") &&
      i.notes?.toLowerCase().includes("del maguey"))
  );

  if (mezcal) {
    const nameIsGeneric = mezcal.name.toLowerCase() === "mezcal";
    const brandInNotes = mezcal.notes?.toLowerCase().includes("del maguey") ||
      false;

    results.mezcalNormalization.correct = nameIsGeneric && brandInNotes;
    results.mezcalNormalization.details = nameIsGeneric
      ? (brandInNotes
        ? "Correct: Generic name with brand in notes"
        : "Partial: Generic name but missing brand in notes")
      : "Incorrect: Brand name not moved to notes";
  } else {
    results.mezcalNormalization.details =
      "Incorrect: Mezcal ingredient not found";
  }

  // Check Red Bitter normalization
  const redBitter = extracted.ingredients.find((i) =>
    i.name.toLowerCase().includes("bitter") ||
    i.name.toLowerCase().includes("campari") ||
    (i.notes?.toLowerCase().includes("campari") ||
      i.notes?.toLowerCase().includes("strucchi"))
  );

  if (redBitter) {
    const nameIsGeneric = !redBitter.name.toLowerCase().includes("strucchi");
    const brandInNotes = (redBitter.notes?.toLowerCase().includes("strucchi") ||
      redBitter.notes?.toLowerCase().includes("campari")) || false;

    results.redBitterNormalization.correct = nameIsGeneric && brandInNotes;
    results.redBitterNormalization.details = nameIsGeneric
      ? (brandInNotes
        ? "Correct: Generic name with brand in notes"
        : "Partial: Generic name but missing brand in notes")
      : "Incorrect: Brand name not moved to notes";
  } else {
    results.redBitterNormalization.details =
      "Incorrect: Red bitter ingredient not found";
  }

  // Calculate overall score (simple percentage-based)
  const checks = [
    results.titleMatch,
    results.ingredientCount.correct,
    results.mezcalNormalization.correct,
    results.redBitterNormalization.correct,
    results.instructionsMatch.correct,
    results.glasswareMatch,
  ];

  const passedChecks = checks.filter(Boolean).length;
  results.overallScore = Math.round((passedChecks / checks.length) * 100);

  return {
    ...results,
    summary: `Overall extraction quality score: ${results.overallScore}%`,
  };
}

// Run the evaluation if this file is executed directly
if (import.meta.main) {
  await evaluateExtraction();
}
