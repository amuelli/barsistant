import { generateObject, ModelMessage } from "ai";
import { z } from "zod";
import { executeAIOperation, getModel } from "./ai-core.ts";
import { INGREDIENT_TYPES, MEASUREMENT_UNITS } from "../../types/ingredient.ts";
import { GLASSWARE_TYPES } from "../../types/recipe.ts";
import {
  calculateSizeMetrics,
  getMaxCharsForTokens,
  isContentTooLarge,
  truncateContent,
} from "./content-size.ts";

export const RECIPE_EXTRACTION_SYSTEM_PROMPT = `
You are an expert cocktail recipe analyzer and extractor.
Extract detailed, structured information from the provided cocktail recipe text.
Focus on cocktail name, ingredients with precise measurements, and preparation steps.
Use standard cocktail measurement units (oz, ml, dash, etc.) and ensure quantities are numeric when possible.
For ingredients, determine the type (e.g., spirit, liqueur, mixer, syrup) based on context.

IMPORTANT FOR INGREDIENT NAMES:
- Use generic ingredient names rather than specific brands (e.g., "Bourbon" not "Maker's Mark")
- Move brand recommendations, vintage specifications, or special variety details to the 'notes' field
- For example: "Maker's Mark Bourbon" should be split into name="Bourbon" and notes="Maker's Mark recommended"
- Another example: "Del Maguey Vida Mezcal" should be split into name="Mezcal" and notes="Del Maguey Vida recommended"
- This ensures better ingredient matching and recipe organization while preserving important details

Organize instructions into clear, sequential steps.
If a clear image of the cocktail is present on the website, extract its direct image URL and include it as the 'image' field. Prefer the main cocktail photo, not logos or unrelated images. If not available, omit the field.
Return data in the specified JSON structure without any additional commentary.
`;

export const RecipeExtractionSchema = z.object({
  title: z.string().describe("The name of the cocktail recipe"),
  description: z.string().describe(
    "A brief description of the cocktail, including its flavor profile or history. Don't include anything too salesy or promotional.",
  ),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unit: z.enum(MEASUREMENT_UNITS),
    optional: z.boolean().default(false).describe(
      "Indicates if the ingredient is optional. If true, the ingredient can be omitted without significantly altering the cocktail.",
    ),
    type: z.enum(INGREDIENT_TYPES),
    notes: z.string().optional().describe(
      "Any additional notes about the ingredient, such as preparation or specific brand recommendations.",
    ),
  })),
  instructions: z.array(z.string()).describe(
    "Step-by-step instructions for preparing the cocktail",
  ),
  garnish: z.array(z.string()).optional(),
  glassware: z.enum(GLASSWARE_TYPES),
  category: z.array(z.string()).optional().describe(
    "Categories or tags for the cocktail, such as 'classic', 'modern', 'tiki', 'sour', 'aperitivo', etc. Use an array to allow multiple categories. Make them lowercase and use hyphens instead of spaces. Do not include any special characters or punctuation.",
  ),
  source: z.object({
    url: z.string(),
    name: z.string().optional(),
    author: z.string().optional(),
    image: z.url().optional().describe(
      "Direct URL to a clear image of the cocktail from the website, if available. Prefer the main cocktail photo, not logos or unrelated images. Omit if not available.",
    ),
  }),
});

export type RecipeExtraction = z.infer<typeof RecipeExtractionSchema>;

export async function extractRecipeFromContent(
  content: string,
  sourceUrl: string,
): Promise<RecipeExtraction> {
  // Check content size and reduce if necessary
  const MAX_SAFE_TOKENS = 7500; // Conservative limit for gpt-4o with 30k limit
  const MAX_CHARS = getMaxCharsForTokens(MAX_SAFE_TOKENS);

  let processedContent = content;

  if (isContentTooLarge(content, MAX_SAFE_TOKENS)) {
    const metrics = calculateSizeMetrics(content, content);
    console.log(
      `Content too large: ${metrics.originalSize} chars (~${metrics.estimatedTokens} tokens), reducing to fit ${MAX_SAFE_TOKENS} token limit...`,
    );

    // Truncate content intelligently
    processedContent = truncateContent(content, MAX_CHARS);

    const reducedMetrics = calculateSizeMetrics(content, processedContent);
    console.log(
      `Reduced content to ${reducedMetrics.processedSize} chars (~${reducedMetrics.estimatedTokens} tokens, ${reducedMetrics.reductionPercent}% reduction)`,
    );
  }

  try {
    return await executeAIOperation(async () => {
      const model = getModel();
      const messages: ModelMessage[] = [
        { role: "system", content: RECIPE_EXTRACTION_SYSTEM_PROMPT },
        {
          role: "user",
          content:
            `Extract the complete cocktail recipe from the following content. Make sure to extract the image URL if present in img tags:\n\n${processedContent}`,
        },
      ];
      const result = await generateObject({
        model,
        messages,
        schema: RecipeExtractionSchema,
        maxOutputTokens: 1024,
        temperature: 0.2,
      });
      if (!result.object) {
        throw new Error("No structured object received from AI provider");
      }

      return result.object as RecipeExtraction;
    }, "Failed to extract recipe from content");
  } catch (error) {
    // Check if it's a token limit error and retry with even smaller content
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes("token") ||
      errorMessage.includes("too large") ||
      errorMessage.includes("rate_limit_exceeded")
    ) {
      console.warn(
        "Token limit error detected, retrying with significantly reduced content...",
      );

      // Try with 50% of the safe limit
      const FALLBACK_CHARS = getMaxCharsForTokens(MAX_SAFE_TOKENS / 2);
      const fallbackContent = truncateContent(content, FALLBACK_CHARS);

      const fallbackMetrics = calculateSizeMetrics(content, fallbackContent);
      console.log(
        `Fallback: reduced to ${fallbackMetrics.processedSize} chars (~${fallbackMetrics.estimatedTokens} tokens)`,
      );

      // Recursive call with smaller content
      return await extractRecipeFromContent(fallbackContent, sourceUrl);
    }

    // Re-throw if not a token limit error
    throw error;
  }
}
