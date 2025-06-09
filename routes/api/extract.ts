/// <reference lib="deno.unstable" />

// Extraction API endpoint for handling recipe extraction requests
import { FreshContext } from "fresh";
import type {
  IngredientType,
  MeasurementUnit,
} from "../../types/ingredient.ts";
import { GlasswareType } from "../../types/recipe.ts";
import {
  extractRecipeFromContent,
  generateCocktailImage,
  type RecipeExtraction,
} from "../../utils/ai-provider.ts";
import { createRecipeWithSimpleIngredients } from "../../utils/recipe-helper.ts";
import { fetchUrlContent, prepareHtmlForAI } from "../../utils/url-content.ts";

// Interface for extract API request body
interface ExtractRequestBody {
  url: string;
}

export async function handler(ctx: FreshContext) {
  console.log("[extract] Incoming request", {
    method: ctx.req.method,
    contentType: ctx.req.headers.get("content-type"),
  });

  try {
    // Parse request body - handle both JSON and form data
    let body: ExtractRequestBody;
    const requestContentType = ctx.req.headers.get("content-type") || "";

    if (requestContentType.includes("application/json")) {
      body = await ctx.req.json();
      console.log("[extract] Parsed JSON body", body);
    } else if (
      requestContentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await ctx.req.formData();
      body = {
        url: formData.get("url")?.toString() || "",
      };
      console.log("[extract] Parsed form body", body);
    } else {
      console.warn("[extract] Unsupported content type", requestContentType);
      return Response.json(
        { success: false, error: "Unsupported content type" },
        { status: 400 },
      );
    }

    // Validate URL
    if (!body.url || !body.url.trim()) {
      console.warn("[extract] Missing or empty URL");
      return Response.json(
        { success: false, error: "URL is required" },
        { status: 400 },
      );
    }

    // Fetch content from URL
    console.log("[extract] Fetching content from URL", body.url);
    const { html, contentType: responseContentType } = await fetchUrlContent(
      body.url,
    );
    console.log("[extract] Fetched content type", responseContentType);

    // Check if content is HTML
    if (
      !responseContentType.includes("text/html") &&
      !responseContentType.includes("application/xhtml+xml")
    ) {
      console.warn("[extract] URL did not return HTML content");
      return Response.json(
        { success: false, error: "URL must point to a valid HTML page" },
        { status: 400 },
      );
    }

    // Prepare HTML for AI extraction
    console.log("[extract] Preparing HTML for AI extraction");
    const optimizedContent = prepareHtmlForAI(html);
    if (!optimizedContent) {
      console.warn("[extract] Could not parse HTML content");
      return Response.json(
        { success: false, error: "Could not parse HTML content" },
        { status: 400 },
      );
    }

    // Extract recipe using AI service
    let extractedRecipe: RecipeExtraction;
    try {
      // Check if API provider and key are configured
      const aiProvider = Deno.env.get("AI_PROVIDER");
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
      const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

      if (!aiProvider) {
        throw new Error(
          "AI provider not configured. Please set the AI_PROVIDER environment variable.",
        );
      }
      if (aiProvider === "openai" && !openaiApiKey) {
        throw new Error(
          "OpenAI API key not set. Please set the OPENAI_API_KEY environment variable.",
        );
      }
      if (aiProvider === "anthropic" && !anthropicApiKey) {
        throw new Error(
          "Anthropic API key not set. Please set the ANTHROPIC_API_KEY environment variable.",
        );
      }
      if (!openaiApiKey && !anthropicApiKey) {
        throw new Error(
          "No API key configured. Please set either OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.",
        );
      }
      console.log("[extract] Using AI provider:", aiProvider);
      extractedRecipe = await extractRecipeFromContent(
        optimizedContent,
        body.url,
      );
      console.log("[extract] AI extraction complete", extractedRecipe);
    } catch (error) {
      console.error("[extract] AI extraction failed:", error);
      throw error;
    }

    // Generate AI cocktail image (if possible)
    let aiImageUrl: string | undefined = undefined;
    try {
      console.log("[extract] Generating AI cocktail image");
      aiImageUrl = await generateCocktailImage(
        extractedRecipe.title,
        extractedRecipe.ingredients.map((i) => i.name),
        extractedRecipe.image,
      );
      if (aiImageUrl) {
        console.log("[extract] AI image generated and saved at", aiImageUrl);
      } else {
        console.warn("[extract] No AI image generated");
      }
    } catch (err) {
      console.warn(
        "[extract] AI image generation failed, falling back to extracted image.",
        err,
      );
    }

    // Map AI extraction to recipe model, only use generated image if available
    console.log("[extract] Mapping extraction to recipe model");
    const recipeParams = mapExtractionToRecipe(
      { ...extractedRecipe, image: aiImageUrl || undefined },
      body.url,
    );

    // Save recipe to database using the helper function that handles ingredients automatically
    console.log("[extract] Saving recipe to database");
    const recipe = await createRecipeWithSimpleIngredients(recipeParams);
    console.log("[extract] Recipe saved", { id: recipe.id });

    // Return success response with the new recipe ID
    return Response.json({
      success: true,
      recipeId: recipe.id,
    });
  } catch (error) {
    console.error("Extraction error:", error);

    // Return appropriate error response
    return Response.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "An unknown error occurred",
      },
      { status: 500 },
    );
  }
}

/**
 * Maps extracted recipe data to the format expected by createRecipeWithSimpleIngredients
 *

/**
 * Maps extracted recipe data to the format expected by createRecipeWithSimpleIngredients
 *
 * @param extraction The extracted recipe data from AI
 * @param sourceUrl The source URL of the recipe
 * @returns Parameters for createRecipeWithSimpleIngredients
 */
function mapExtractionToRecipe(
  extraction: RecipeExtraction,
  sourceUrl: string,
) {
  // Map ingredients - AI extraction format to SimpleIngredient format
  // This preserves the ingredient name and type for JIT creation
  const ingredients = extraction.ingredients.map((ing) => {
    // Validate ingredient type against allowed IngredientType values
    const validType = [
        "spirit",
        "liqueur",
        "wine",
        "mixer",
        "juice",
        "syrup",
        "bitter",
        "fruit",
        "herb",
        "spice",
        "other",
      ].includes(ing.type)
      ? (ing.type as IngredientType)
      : "other" as IngredientType;

    return {
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit as MeasurementUnit, // Cast to expected enum
      optional: ing.optional,
      notes: ing.notes,
      type: validType, // Use validated type
    };
  });

  return {
    name: extraction.title,
    description: extraction.description,
    strength: 5, // Default values since AI extraction doesn't provide these
    sweetness: 5,
    ingredients,
    garnish: extraction.garnish || [],
    glassware: extraction.glassware as GlasswareType,
    preparation: extraction.instructions,
    source: {
      name: extraction.source.name || new URL(sourceUrl).hostname,
      url: sourceUrl,
    },
    tags: extraction.category || [],
    image: extraction.image, // Pass through the image URL if present
  };
}
