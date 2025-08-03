/**
 * Shared test cases for recipe extraction evaluation
 *
 * This file centralizes the test case definitions used across various scripts:
 * - fetch-eval-data.ts (for fetching test data)
 * - extraction_eval.ts (for evaluating extraction quality)
 * - add-test-case.ts (for adding new test cases)
 */

import { type RecipeExtraction } from "./extraction.ts";

/**
 * Interface for recipe test cases used in evaluation
 */
export interface RecipeTestCase {
  id: string;
  name: string;
  url: string;
  expectedExtraction?: RecipeExtraction; // Optional as it might be loaded from file
}

/**
 * Registry of test cases for extraction evaluation
 * The expected extraction data will be loaded from JSON files
 */
export const TEST_CASES: RecipeTestCase[] = [
  {
    id: "mosquito-sam-ross",
    name: "Mosquito by Sam Ross",
    url:
      "https://www.diffordsguide.com/cocktails/recipe/32305/mosquito-by-sam-ross",
  },
  {
    id: "pegu-club-cocktail",
    name: "Pegu Club Cocktail",
    url: "https://www.youtube.com/watch?v=989hd-zEmLI",
  },
  {
    id: "paper-plane-liquor",
    name: "Paper Plane (Liquor.com)",
    url: "https://www.liquor.com/recipes/the-paper-plane/",
  },
  // Additional test cases can be added here
  // Example:
  // {
  //   id: "negroni-classic",
  //   name: "Classic Negroni",
  //   url: "https://www.diffordsguide.com/cocktails/recipe/1204/negroni",
  // },
];
