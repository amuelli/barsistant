import { ulid } from "@std/ulid";
import { z } from "zod";
import type { Recipe } from "../types/recipe.ts";
import { generateCocktailImage } from "./ai-provider.ts";
import { DatabaseError, recipes } from "./db.ts";
import { uploadImageToS3 } from "./s3.ts";

export const GenerateRecipeImageJobSchema = z.object({
  type: z.literal("generate_recipe_image"),
  recipeId: z.string(),
});
export type GenerateRecipeImageJob = z.infer<
  typeof GenerateRecipeImageJobSchema
>;

export const isGenerateRecipeImageJob = (
  msg: unknown,
): msg is GenerateRecipeImageJob =>
  GenerateRecipeImageJobSchema.safeParse(msg).success;

/**
 * Deno KV Queue Handler for Background Recipe Image Generation
 *
 * This handler listens for 'generate_recipe_image' jobs and processes them:
 * 1. Fetches the recipe by ID
 * 2. Generates an image using the AI provider
 * 3. Uploads the image to S3
 * 4. Updates the recipe record with the image URL
 * 5. Handles errors and logs failures (retries automatically)
 */
// Moved to jobs/recipe-image-job.ts
export async function handleGenerateRecipeImageJob(
  job: GenerateRecipeImageJob,
) {
  const { recipeId } = job;
  try {
    const recipe = await recipes.get<Recipe>(recipeId);
    if (!recipe) {
      throw new DatabaseError(`Recipe not found: ${recipeId}`);
    }
    // Only generate if image is missing
    if (recipe.image) {
      console.log(
        `[recipe-image-job] Recipe ${recipeId} already has an image, skipping generation.`,
      );
      return;
    }
    // Use the extracted source image as input for image-to-image generation if present
    const sourceImage = recipe.source?.image;
    const aiImageBuffer = await generateCocktailImage(
      recipe.name,
      recipe.ingredients.map((i) => i.name),
      sourceImage, // Prefer the extracted source image for image-to-image
    );
    let aiImageUrl: string | undefined = undefined;
    if (aiImageBuffer) {
      const s3Key = `images/${ulid()}.png`;
      const s3Result = await uploadImageToS3(
        aiImageBuffer,
        s3Key,
        "image/png",
      );
      aiImageUrl = s3Result.url;
      console.log(
        `[recipe-image-job] AI image generated and uploaded to S3 at`,
        aiImageUrl,
      );
    } else {
      console.warn(
        `[recipe-image-job] No AI image generated for recipe ${recipeId}`,
      );
    }
    // Update recipe with image URL if generated
    if (aiImageUrl) {
      await recipes.set(recipeId, { ...recipe, image: aiImageUrl });
      console.log(`[recipe-image-job] Recipe image updated for ${recipeId}`);
    }
  } catch (err) {
    console.error(
      `[recipe-image-job] Failed to process image generation for recipe ${recipeId}:`,
      err,
    );
    throw err; // Rethrow to trigger automatic retry
  }
}
