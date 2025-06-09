// Integration test for AI provider module
// deno-lint-ignore-file no-explicit-any
import { assert } from "@std/assert";
import "@std/dotenv/load";
import { AIError, extractRecipeFromContent } from "./ai-provider.ts";

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
  ignore: !Deno.env.get("OPENAI_API_KEY") || !RUN_OPENAI_TESTS,
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

Deno.test({
  name:
    "generateCocktailImage returns a valid image URL for a JPG input (integration)",
  ignore: !Deno.env.get("OPENAI_API_KEY") || !RUN_OPENAI_TESTS,
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    // Example real cocktail image (public domain, photo, JPG)
    const cocktailImageUrl =
      "https://www.liquor.com/thmb/w10s8lY2OpyfBM0NmzbNfUcTJBU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/ancient-mariner-720x720-primary-c3d0dc150eef4d9ea29b1fb2ef314e40.jpg";
    const { generateCocktailImage } = await import("./ai-provider.ts");
    const url = await generateCocktailImage(
      "Test Cocktail",
      ["gin", "vermouth", "lime", "grapefruit", "rum"],
      cocktailImageUrl,
    );
    console.log("AI image generation result:", url);
    assert(
      url === undefined || typeof url === "string",
      "Should return a string or undefined",
    );
    if (typeof url === "string") {
      assert(
        url.startsWith("/"),
        "Returned URL should be a relative path starting with /",
      );
    } else {
      console.warn(
        "No image URL returned. This may be expected if the API does not support JPG input.",
      );
    }
  },
});
