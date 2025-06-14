import { type CreateMessage, generateObject } from "ai";
import { z } from "zod";
import { executeAIOperation, getModel } from "./ai-core.ts";

export const RECIPE_EXTRACTION_SYSTEM_PROMPT = `
You are an expert cocktail recipe analyzer and extractor.
Extract detailed, structured information from the provided cocktail recipe text.
Focus on cocktail name, ingredients with precise measurements, and preparation steps.
Use standard cocktail measurement units (oz, ml, dash, etc.) and ensure quantities are numeric when possible.
For ingredients, determine the type (e.g., spirit, liqueur, mixer, garnish) based on context.
Organize instructions into clear, sequential steps.
If a clear image of the cocktail is present on the website, extract its direct image URL and include it as the 'image' field. Prefer the main cocktail photo, not logos or unrelated images. If not available, omit the field.
Return data in the specified JSON structure without any additional commentary.
`;

export const RecipeExtractionSchema = z.object({
  title: z.string().describe("The name of the cocktail recipe"),
  description: z.string(),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unit: z.string().describe(
      `needs to be a valid measurement unit from this list: ml, oz, cl, dash, drop, barspoon, tsp, tbsp, cup, pint, part, piece, slice, whole, pinch, spritz, leaf, sprig, rim.`,
    ),
    optional: z.boolean(),
    type: z.string().describe(
      `needs to be a valid ingredient type from this list: spirit, liqueur, wine, mixer, juice, syrup, bitter, fruit, herb, spice, other.`,
    ),
    notes: z.string().optional().describe(
      "Any additional notes about the ingredient, such as preparation or specific brand recommendations.",
    ),
  })),
  instructions: z.array(z.string()).describe(
    "Step-by-step instructions for preparing the cocktail",
  ),
  garnish: z.array(z.string()).optional(),
  glassware: z.string().describe(
    `needs to be a valid glassware type from this list: martini, coupe, highball, collins, old-fashioned, nick-and-nora, margarita, hurricane, sour, fizz, wine, shot, irish-coffee.`,
  ),
  category: z.array(z.string()).optional(),
  source: z.object({
    url: z.string(),
    name: z.string().optional(),
    author: z.string().optional(),
    image: z.string().url().optional().describe(
      "Direct URL to a clear image of the cocktail from the website, if available. Prefer the main cocktail photo, not logos or unrelated images. Omit if not available.",
    ),
  }),
});

export type RecipeExtraction = z.infer<typeof RecipeExtractionSchema>;

export async function extractRecipeFromContent(
  content: string,
  _sourceUrl: string,
): Promise<RecipeExtraction> {
  return await executeAIOperation(async () => {
    const model = getModel();
    const messages: CreateMessage[] = [
      { role: "system", content: RECIPE_EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `Extract the complete cocktail recipe from the following text content:\n\n${content}\n\nFormat your response as a JSON object with the following structure:\n{ ... }`,
      },
    ];
    const result = await generateObject({
      model,
      messages,
      schema: RecipeExtractionSchema,
      maxTokens: 1024,
      temperature: 0.2,
    });
    if (!result.object) {
      throw new Error("No structured object received from AI provider");
    }
    return result.object as RecipeExtraction;
  }, "Failed to extract recipe from content");
}
