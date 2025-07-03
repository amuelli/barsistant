/**
 * Recipe extraction evaluation runner script
 *
 * This script is used to evaluate the recipe extraction pipeline
 * by testing it with real-world recipe examples using pre-processed HTML
 * stored in the eval-data directory.
 *
 * Usage:
 * deno run -A scripts/eval-extraction.ts
 */

import "@std/dotenv/load";
import { evaluateExtraction } from "../utils/ai/extraction_eval.ts";

// Environment variables are loaded automatically via the import

console.log("Running recipe extraction evaluation...\n");
await evaluateExtraction();
console.log("\nEvaluation completed.");
