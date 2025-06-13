/// <reference lib="deno.unstable" />

/**
 * AI Provider Module for Barsistant (Provider-agnostic via ai-sdk)
 *
 * This module uses the ai-sdk (https://ai-sdk.dev) for provider-agnostic AI integration.
 * Supported providers: OpenAI, Anthropic, and more (see ai-sdk docs).
 *
 * Environment variables required:
 *   - AI_PROVIDER: "openai" | "anthropic" | ...
 *   - {PROVIDER}_API_KEY: API key for the selected provider
 *
 * To add a new provider:
 *   1. Set AI_PROVIDER and {PROVIDER}_API_KEY in your environment.
 *   2. Optionally extend the getAIClient() factory for custom logic.
 *   3. See https://ai-sdk.dev/docs/providers for details.
 */

// npm imports for ai-sdk (Deno compatibility via npm specifier)
import { openai } from "@ai-sdk/openai";
import "@std/dotenv/load";
import { type CreateMessage, generateObject, generateText } from "ai";
import OpenAI from "jsr:@openai/openai";
import { z } from "zod";
import { IngredientType, MeasurementUnit } from "../types/ingredient.ts";

// import { anthropic } from "npm:@ai-sdk/anthropic@3.1.13"; // Uncomment if Anthropic is needed

// Error class for AI operations
export class AIError extends Error {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message);
    this.name = "AIError";
  }
}

// Provider selection from environment
const PROVIDER = Deno.env.get("AI_PROVIDER") || "openai";
const MODEL = Deno.env.get("AI_MODEL") ||
  (PROVIDER === "openai" ? "gpt-4o" : undefined);

// Provider-agnostic model selector
function getModel() {
  switch (PROVIDER) {
    case "openai":
      return openai(MODEL || "gpt-4o");
    // case "anthropic":
    //   return anthropic(MODEL || "claude-3-opus-20240229");
    default:
      throw new AIError(`Unknown AI provider: ${PROVIDER}`);
  }
}

/**
 * Executes an AI operation with error handling
 *
 * @param operation Function that performs an AI operation
 * @param errorMessage Custom error message if the operation fails
 * @returns The result of the AI operation
 * @throws {AIError} If the operation fails
 */
export async function executeAIOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new AIError(errorMessage, error);
  }
}

/**
 * Interface for recipe extraction from text content
 */
export interface RecipeExtraction {
  title: string;
  description: string;
  ingredients: {
    name: string;
    quantity: number;
    unit: MeasurementUnit;
    optional: boolean;
    type: IngredientType;
    notes?: string;
  }[];
  instructions: string[];
  garnish?: string[];
  glassware: string;
  category?: string[];
  source: {
    url: string;
    name?: string;
    author?: string;
  };
  image?: string; // URL of a cocktail image from the website, if available
}

/**
 * System prompt for recipe extraction
 */
const RECIPE_EXTRACTION_SYSTEM_PROMPT = `
You are an expert cocktail recipe analyzer and extractor.
Extract detailed, structured information from the provided cocktail recipe text.
Focus on cocktail name, ingredients with precise measurements, and preparation steps.
Use standard cocktail measurement units (oz, ml, dash, etc.) and ensure quantities are numeric when possible.
For ingredients, determine the type (e.g., spirit, liqueur, mixer, garnish) based on context.
Organize instructions into clear, sequential steps.
If a clear image of the cocktail is present on the website, extract its direct image URL and include it as the 'image' field. Prefer the main cocktail photo, not logos or unrelated images. If not available, omit the field.
Return data in the specified JSON structure without any additional commentary.
`;

/**
 * Interface for recording extraction feedback
 */
export interface ExtractionFeedback {
  originalExtraction: RecipeExtraction;
  correctedExtraction: RecipeExtraction;
  sourceUrl: string;
  timestamp: Date;
}

// Collection to store extraction feedback for learning
const extractionFeedbackCollection: ExtractionFeedback[] = [];

/**
 * System prompt for learning from feedback
 */
const FEEDBACK_LEARNING_PROMPT = `
As an expert cocktail recipe analyzer, review the difference between the original AI extraction and the user's corrected version.
Analyze what aspects were missed or incorrectly extracted in the original extraction.
Focus on:
1. Ingredient identification accuracy
2. Measurement parsing
3. Instruction segmentation
4. Category recognition
Provide concise notes on how to improve future extractions based on these corrections.
`;

// Zod schema for structured recipe extraction (matches RecipeExtraction interface)
const RecipeExtractionSchema = z.object({
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
  }),
  image: z.string().url().optional().describe(
    "Direct URL to a clear image of the cocktail from the website, if available. Prefer the main cocktail photo, not logos or unrelated images. Omit if not available.",
  ),
});

/**
 * Extracts recipe information from text content
 *
 * @param content The text content to extract recipe from
 * @param sourceUrl The source URL of the content
 * @returns The extracted recipe information
 */
export async function extractRecipeFromContent(
  content: string,
  _sourceUrl: string, // unused, but kept for interface compatibility
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
    // Use ai-sdk's generateObject for structured extraction with zod schema
    const result = await generateObject({
      model,
      messages,
      schema: RecipeExtractionSchema,
      maxTokens: 1024,
      temperature: 0.2,
    });
    if (!result.object) {
      throw new AIError("No structured object received from AI provider");
    }
    // Zod validation ensures type safety
    return result.object as RecipeExtraction;
  }, "Failed to extract recipe from content");
}

/**
 * Records feedback on an extraction to improve future extraction quality
 *
 * @param original The original AI extraction
 * @param corrected The user-corrected extraction
 * @param sourceUrl The source URL of the content
 * @returns A promise that resolves when feedback is processed
 */
export async function recordExtractionFeedback(
  original: RecipeExtraction,
  corrected: RecipeExtraction,
  sourceUrl: string,
): Promise<void> {
  return await executeAIOperation(async () => {
    // Store feedback for future training
    const feedback: ExtractionFeedback = {
      originalExtraction: original,
      correctedExtraction: corrected,
      sourceUrl,
      timestamp: new Date(),
    };

    extractionFeedbackCollection.push(feedback);

    // If we have enough feedback samples, use them to get extraction improvement insights
    if (extractionFeedbackCollection.length >= 5) {
      await getExtractionImprovementInsights();
    }
  }, "Failed to record extraction feedback");
}

/**
 * Gets insights on how to improve extraction based on collected feedback
 * This is called automatically when enough feedback is collected
 */
async function getExtractionImprovementInsights(): Promise<void> {
  try {
    console.log(
      `Analyzing ${extractionFeedbackCollection.length} feedback samples for extraction improvements`,
    );

    // Get the last 5 feedback entries
    const recentFeedback = extractionFeedbackCollection.slice(-5);
    const model = getModel();

    // For each feedback pair, get insights
    for (const feedback of recentFeedback) {
      const messages: CreateMessage[] = [
        { role: "system", content: FEEDBACK_LEARNING_PROMPT },
        {
          role: "user",
          content:
            `\nCompare the original AI extraction with the user's corrected version:\n\nOriginal Extraction:\n${
              JSON.stringify(feedback.originalExtraction, null, 2)
            }\n\nCorrected by User:\n${
              JSON.stringify(feedback.correctedExtraction, null, 2)
            }\n\nSource URL: ${feedback.sourceUrl}\n\nWhat improvements can be made to the extraction algorithm based on these differences?`,
        },
      ];
      const result = await generateText({
        model,
        messages,
        maxTokens: 150,
        temperature: 0.2,
      });
      const insights = result.text;
      if (insights) {
        console.log("Improvement Insights:", insights);
      } else {
        console.warn("No insights received for feedback:", feedback);
      }
    }
  } catch (error) {
    console.error("Failed to get extraction improvement insights:", error);
  }
}

/**
 * Generates a cocktail image using an AI image provider (OpenAI DALL-E/gpt-image-1)
 *
 * @param recipeName The name of the cocktail (used in the prompt)
 * @param ingredients The main ingredients (used in the prompt)
 * @param cocktailImageUrl (Optional) A URL to a cocktail image (PNG or JPG). If provided, the image will be used as input for image-to-image generation. If omitted, only the prompt will be used (text-to-image).
 * @returns The generated image as a Uint8Array (PNG or JPG), or undefined if generation fails
 */
export async function generateCocktailImage(
  recipeName: string,
  ingredients: string[],
  cocktailImageUrl?: string,
): Promise<Uint8Array | undefined> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return undefined;

  // Download the cocktail image as ArrayBuffer (if provided)
  let cocktailImageBuffer: ArrayBuffer | undefined = undefined;
  let imageType = "image/png";
  let imageExt = "png";
  if (cocktailImageUrl) {
    try {
      const cocktailRes = await fetch(cocktailImageUrl);
      if (cocktailRes.ok) {
        const contentType = cocktailRes.headers.get("content-type") || "";
        if (contentType.includes("jpeg") || contentType.includes("jpg")) {
          imageType = "image/jpeg";
          imageExt = "jpg";
        }
        cocktailImageBuffer = await cocktailRes.arrayBuffer();
      }
    } catch (err) {
      console.warn("Failed to fetch cocktail image for image edit", err);
    }
  }

  const prompt =
    `minimalist, flat-style vector illustration of a cocktail drink (do not include any text or lettering in the image) called '${recipeName}', made with ${
      ingredients.join(", ")
    },${
      cocktailImageUrl ? " based on the photo provided," : ""
    } the style should match modern cocktail icons, with clean black outlines, simplified shapes, and subtle use of flat colors. Include a garnish like a cherry, lime, or umbrella if present in the original.`;

  const openai = new OpenAI({ apiKey });
  try {
    let response: OpenAI.ImagesResponse;
    if (cocktailImageBuffer) {
      response = await openai.images.edit({
        image: new File([cocktailImageBuffer], `cocktail.${imageExt}`, {
          type: imageType,
        }),
        prompt,
        n: 1,
        model: "gpt-image-1",
        quality: "low",
        background: "transparent",
      });
    } else {
      // Fallback to text-to-image if no image is provided
      response = await openai.images.generate({
        prompt,
        n: 1,
        model: "gpt-image-1",
        quality: "low",
        background: "transparent",
      });
    }
    // Always handle base64-encoded image (gpt-image-1 returns b64_json, not url)
    const b64 = response.data?.[0]?.b64_json;
    if (b64) {
      const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      return binary;
    }
    console.error(
      "OpenAI image API error: No base64 image returned",
      JSON.stringify(response),
    );
    return undefined;
  } catch (err) {
    console.error("AI image generation failed:", err);
    return undefined;
  }
}
