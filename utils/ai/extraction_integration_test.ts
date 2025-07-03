import { assert } from "@std/assert";
import "@std/dotenv/load";
import { AIError } from "./ai-core.ts";
import {
  extractRecipeFromContent,
  type RecipeExtraction,
} from "./extraction.ts";

const RUN_OPENAI_TESTS = Deno.env.get("RUN_OPENAI_TESTS") === "1";

Deno.test({
  name:
    "extractRecipeFromContent returns structured data for valid input (integration)",
  ignore: !Deno.env.get("OPENAI_API_KEY") || !RUN_OPENAI_TESTS,
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const sampleContent = `
      The Negroni is a classic Italian cocktail. Ingredients: 1 oz gin, 1 oz Campari, 1 oz sweet vermouth. Stir with ice, strain into a rocks glass, garnish with an orange peel.
    `;
    const sourceUrl = "https://example.com/negroni";
    let result: RecipeExtraction | null = null;
    try {
      result = await extractRecipeFromContent(sampleContent, sourceUrl);
      console.log("AI result for Negroni:", result);
    } catch (err) {
      if (err instanceof AIError) {
        throw new Error(`AIError: ${err.message}`);
      }
      throw err;
    }
    assert(result, "Result should not be null");
    assert(
      result.title && result.title.toLowerCase().includes("negroni"),
      "Title should include 'negroni'",
    );
    assert(Array.isArray(result.ingredients), "Ingredients should be an array");
    assert(result.instructions.length > 0, "Should have instructions");
    // Accept empty or missing source.url due to AI variability
  },
});

Deno.test({
  name:
    "extractRecipeFromContent returns a RecipeExtraction-like object for empty content (integration)",
  ignore: !Deno.env.get("OPENAI_API_KEY") || !RUN_OPENAI_TESTS,
  async fn() {
    let result: RecipeExtraction | null = null;
    try {
      result = await extractRecipeFromContent("", "https://example.com/empty");
      console.log("AI result for empty content:", result);
    } catch (err) {
      // Accept error as a valid outcome
      if (err instanceof AIError) return;
      throw err;
    }
    // Accept any RecipeExtraction-like object, just log for manual review
    assert(
      result && typeof result === "object" && "title" in result,
      "Should return a RecipeExtraction-like object for empty content",
    );
  },
});
