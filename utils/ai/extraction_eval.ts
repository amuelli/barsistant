/**
 * Evaluation script for the recipe extraction pipeline
 *
 * This script tests the extraction pipeline using preprocessed real-world cocktail recipes
 * from the eval-data directory and outputs the structured result for verification.
 */

import "@std/dotenv/load";
import {
  extractRecipeFromContent,
  type RecipeExtraction,
} from "./extraction.ts";
import {
  type RecipeTestCase,
  TEST_CASES,
} from "./extraction_eval_test_cases.ts";

/**
 * Interface for evaluation results
 */
interface EvaluationResult {
  testCase: {
    id: string;
    name: string;
  };
  titleMatch: boolean;
  ingredientCount: {
    expected: number;
    actual: number;
    correct: boolean;
  };
  instructionsMatch: {
    expected: number;
    actual: number;
    correct: boolean;
  };
  glasswareMatch: boolean;
  // Specific recipe-dependent checks
  specificChecks: Record<string, { correct: boolean; details: string }>;
  overallScore: number;
  summary: string;
}

/**
 * Loads the test cases with their expected extraction data
 */
async function loadTestCases(): Promise<RecipeTestCase[]> {
  const loadedCases: RecipeTestCase[] = [];

  for (const testCase of TEST_CASES) {
    try {
      // Try to load expected extraction data from JSON file
      const expectedFilePath = `./eval-data/${testCase.id}-expected.json`;
      const expectedJson = await Deno.readTextFile(expectedFilePath);
      const expectedExtraction = JSON.parse(expectedJson) as RecipeExtraction;

      loadedCases.push({
        ...testCase,
        expectedExtraction,
      });

      console.log(`Loaded expected extraction data for ${testCase.name}`);
    } catch (error) {
      console.warn(
        `Warning: Could not load expected extraction for ${testCase.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      console.warn(`Skipping test case ${testCase.name}`);
    }
  }

  return loadedCases;
}

/**
 * Runs the evaluation on all test cases
 */
export async function evaluateExtractions(): Promise<void> {
  console.log("Evaluating recipe extraction pipeline...");

  // Load test cases with expected extraction data
  const testCases = await loadTestCases();
  console.log(`Loaded ${testCases.length} valid test cases`);

  if (testCases.length === 0) {
    console.error(
      "No valid test cases found. Run scripts/fetch-eval-data.ts first and fill in the expected extraction data.",
    );
    return;
  }

  const results: EvaluationResult[] = [];
  let totalScore = 0;

  for (const testCase of testCases) {
    console.log(`\n==== Testing ${testCase.name} ====`);
    const result = await evaluateExtraction(testCase);
    results.push(result);
    totalScore += result.overallScore;
  }

  // Output summary of all evaluations
  console.log("\n==== Evaluation Summary ====");
  results.forEach((result) => {
    console.log(`${result.testCase.name}: ${result.overallScore}%`);
  });

  const averageScore = totalScore / testCases.length;
  console.log(`\nAverage extraction quality: ${Math.round(averageScore)}%`);
}

/**
 * Runs the extraction on a single test case
 * @param testCase The test case to evaluate
 * @returns Evaluation result for the test case
 */
async function evaluateExtraction(
  testCase: RecipeTestCase,
): Promise<EvaluationResult> {
  console.log(`Recipe: ${testCase.name}`);
  console.log(`Using pre-processed HTML from evaluation data`);

  try {
    console.time("Extraction time");

    // Path to the pre-processed HTML file for evaluation
    const processedHtmlPath = `./eval-data/${testCase.id}-processed.html`;

    // Read pre-processed HTML from eval-data directory
    console.log(`Reading pre-processed HTML from ${processedHtmlPath}...`);

    // Read the pre-processed HTML from the file
    const optimizedContent = await Deno.readTextFile(processedHtmlPath);
    console.log(
      `Loaded ${optimizedContent.length} bytes of pre-processed content`,
    );

    // Extract recipe using the same function as production
    console.log("Extracting recipe with AI...");
    const extracted = await extractRecipeFromContent(
      optimizedContent,
      testCase.url,
    );

    console.timeEnd("Extraction time");

    console.log("\nExtracted Recipe:");
    console.log(JSON.stringify(extracted, null, 2));

    // Validate that the extraction matches our expectations
    const evaluation = evaluateExtractionQuality(extracted, testCase);
    console.log("\nEvaluation Results:");
    console.log(evaluation);

    return evaluation;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Extraction failed:", error);
    return {
      testCase: {
        id: testCase.id,
        name: testCase.name,
      },
      titleMatch: false,
      ingredientCount: { expected: 0, actual: 0, correct: false },
      instructionsMatch: { expected: 0, actual: 0, correct: false },
      glasswareMatch: false,
      specificChecks: {},
      overallScore: 0,
      summary: `Extraction failed: ${errorMessage}`,
    };
  }
}

/**
 * Registry of recipe-specific check functions
 * Add new functions here for each recipe that needs special validation
 */
const recipeSpecificChecks: Record<
  string,
  (
    extracted: RecipeExtraction,
  ) => Record<string, { correct: boolean; details: string }>
> = {
  "mosquito-sam-ross": addMosquitoSpecificChecks,
  "pegu-club-cocktail": addPeguClubSpecificChecks,
  // Add other recipe check functions as they're created
};

/**
 * Evaluates the quality of extraction by comparing to expected values
 *
 * @param extracted The extracted recipe
 * @param testCase The test case with expected values
 * @returns An evaluation summary object
 */
function evaluateExtractionQuality(
  extracted: RecipeExtraction,
  testCase: RecipeTestCase,
): EvaluationResult {
  if (!testCase.expectedExtraction) {
    throw new Error(`No expected extraction data available for ${testCase.id}`);
  }

  const expected = testCase.expectedExtraction;

  // Create an evaluation results object
  const results: EvaluationResult = {
    testCase: {
      id: testCase.id,
      name: testCase.name,
    },
    titleMatch: extracted.title.includes(expected.title),
    ingredientCount: {
      expected: expected.ingredients.length,
      actual: extracted.ingredients.length,
      correct: expected.ingredients.length === extracted.ingredients.length,
    },
    instructionsMatch: {
      expected: expected.instructions.length,
      actual: extracted.instructions.length,
      correct: expected.instructions.length === expected.instructions.length,
    },
    glasswareMatch: extracted.glassware === expected.glassware,
    specificChecks: {},
    overallScore: 0,
    summary: "",
  };

  // Add recipe-specific checks if available
  if (recipeSpecificChecks[testCase.id]) {
    results.specificChecks = recipeSpecificChecks[testCase.id](extracted);
  }

  // Calculate overall score
  const standardChecks = [
    results.titleMatch,
    results.ingredientCount.correct,
    results.instructionsMatch.correct,
    results.glasswareMatch,
  ];

  const specificCheckResults = Object.values(results.specificChecks).map(
    (check) => check.correct,
  );
  const allChecks = [...standardChecks, ...specificCheckResults];

  const passedChecks = allChecks.filter(Boolean).length;
  results.overallScore = Math.round((passedChecks / allChecks.length) * 100);
  results.summary =
    `Overall extraction quality score: ${results.overallScore}%`;

  return results;
}

/**
 * Adds Mosquito-specific checks to the evaluation results
 */
function addMosquitoSpecificChecks(
  extracted: RecipeExtraction,
): Record<string, { correct: boolean; details: string }> {
  const specificChecks: Record<string, { correct: boolean; details: string }> =
    {
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

    specificChecks.mezcalNormalization.correct = nameIsGeneric && brandInNotes;
    specificChecks.mezcalNormalization.details = nameIsGeneric
      ? (brandInNotes
        ? "Correct: Generic name with brand in notes"
        : "Partial: Generic name but missing brand in notes")
      : "Incorrect: Brand name not moved to notes";
  } else {
    specificChecks.mezcalNormalization.details =
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

    specificChecks.redBitterNormalization.correct = nameIsGeneric &&
      brandInNotes;
    specificChecks.redBitterNormalization.details = nameIsGeneric
      ? (brandInNotes
        ? "Correct: Generic name with brand in notes"
        : "Partial: Generic name but missing brand in notes")
      : "Incorrect: Brand name not moved to notes";
  } else {
    specificChecks.redBitterNormalization.details =
      "Incorrect: Red bitter ingredient not found";
  }

  return specificChecks;
}

/**
 * Adds Pegu Club-specific checks to the evaluation results
 */
function addPeguClubSpecificChecks(
  extracted: RecipeExtraction,
): Record<string, { correct: boolean; details: string }> {
  const specificChecks: Record<string, { correct: boolean; details: string }> =
    {
      // Check for the presence of the key ingredients
      ginPresent: {
        correct: false,
        details: "",
      },
      curacao: {
        correct: false,
        details: "",
      },
      limeJuice: {
        correct: false,
        details: "",
      },
      bitters: {
        correct: false,
        details: "",
      },
    };

  // Check for gin
  const gin = extracted.ingredients.find((i) =>
    i.name.toLowerCase().includes("gin")
  );

  specificChecks.ginPresent.correct = !!gin;
  specificChecks.ginPresent.details = gin
    ? "Correct: Gin is present in the recipe"
    : "Incorrect: Gin is missing from the recipe";

  // Check for orange curaçao or triple sec
  const curacao = extracted.ingredients.find((i) =>
    i.name.toLowerCase().includes("curaçao") ||
    i.name.toLowerCase().includes("curacao") ||
    i.name.toLowerCase().includes("triple sec") ||
    i.name.toLowerCase().includes("cointreau") ||
    i.name.toLowerCase().includes("orange liqueur")
  );

  specificChecks.curacao.correct = !!curacao;
  specificChecks.curacao.details = curacao
    ? "Correct: Orange curaçao/triple sec is present in the recipe"
    : "Incorrect: Orange curaçao/triple sec is missing from the recipe";

  // Check for lime juice
  const lime = extracted.ingredients.find((i) =>
    i.name.toLowerCase().includes("lime")
  );

  specificChecks.limeJuice.correct = !!lime;
  specificChecks.limeJuice.details = lime
    ? "Correct: Lime juice is present in the recipe"
    : "Incorrect: Lime juice is missing from the recipe";

  // Check for bitters (angostura and orange)
  const bitters = extracted.ingredients.filter((i) =>
    i.name.toLowerCase().includes("bitter") ||
    i.name.toLowerCase().includes("angostura") ||
    i.name.toLowerCase().includes("orange bitter")
  );

  specificChecks.bitters.correct = bitters.length >= 1;
  specificChecks.bitters.details = bitters.length >= 1
    ? "Correct: Bitters are present in the recipe"
    : "Incorrect: Bitters are missing from the recipe";

  return specificChecks;
}

// Run the evaluation if this file is executed directly
if (import.meta.main) {
  await evaluateExtractions();
}
