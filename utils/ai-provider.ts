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
import { type CreateMessage, generateObject, generateText } from "ai";
import { z } from "zod";

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
    quantity: string;
    unit: string;
    optional: boolean;
    type: string;
    notes?: string;
  }[];
  instructions: string[];
  garnish?: string[];
  glassware?: string;
  category?: string[];
  source: {
    url: string;
    name?: string;
    author?: string;
  };
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
  title: z.string(),
  description: z.string(),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.string(),
    unit: z.string(),
    optional: z.boolean(),
    type: z.string(),
    notes: z.string().optional(),
  })),
  instructions: z.array(z.string()),
  garnish: z.array(z.string()).optional(),
  glassware: z.string().optional(),
  category: z.array(z.string()).optional(),
  source: z.object({
    url: z.string(),
    name: z.string().optional(),
    author: z.string().optional(),
  }),
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
