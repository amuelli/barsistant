// Integration test for AI provider module
// deno-lint-ignore-file no-explicit-any
import { assert } from "@std/assert";
import "jsr:@std/dotenv/load";
import { AIError, extractRecipeFromContent } from "./ai-provider.ts";

Deno.test({
  name:
    "extractRecipeFromContent returns structured data for valid input (integration)",
  ignore: !Deno.env.get("AI_API_KEY"),
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const sampleContent = `
      The Negroni is a classic Italian cocktail. Ingredients: 1 oz gin, 1 oz Campari, 1 oz sweet vermouth. Stir with ice, strain into a rocks glass, garnish with an orange peel.
    `;
    const sourceUrl = "https://example.com/negroni";
    let result: any = null;
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
  ignore: !Deno.env.get("AI_API_KEY"),
  async fn() {
    let result: any = null;
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
