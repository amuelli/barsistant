import { ulid } from "@std/ulid";
import { z } from "zod";
import { extractColorPalette } from "../ai/color-extraction.ts";
import { generateCocktailImage } from "../ai/image-generation.ts";
import { uploadImageToS3 } from "../storage/s3.ts";
import { enqueueJob } from "./queue-handler.ts";
import { recipeModel } from "./recipe-model.ts";

export const GenerateRecipeRasterImageJobSchema = z.object({
  type: z.literal("generate_recipe_raster_image"),
  recipeId: z.string(),
});
export type GenerateRecipeRasterImageJob = z.infer<
  typeof GenerateRecipeRasterImageJobSchema
>;

export const isGenerateRecipeRasterImageJob = (
  msg: unknown,
): msg is GenerateRecipeRasterImageJob =>
  GenerateRecipeRasterImageJobSchema.safeParse(msg).success;

/**
 * Deno KV Queue Handler for Background Recipe Raster Image Generation
 *
 * This handler listens for 'generate_recipe_raster_image' jobs and processes them:
 * 1. Fetches the recipe by ID
 * 2. Generates a PNG image using OpenAI
 * 3. Uploads the image to S3
 * 4. Updates the recipe record with the image URL
 * 5. Enqueues a vector conversion job for vector image generation
 * 6. Handles errors and logs failures (retries automatically)
 */
export async function handleGenerateRecipeRasterImageJob(
  job: GenerateRecipeRasterImageJob,
) {
  const { recipeId } = job;
  try {
    const recipe = await recipeModel.getByIdForAdmin(recipeId);
    if (!recipe) {
      throw new Error(`Recipe not found: ${recipeId}`);
    }

    // Set image generation status to raster generating
    await recipeModel.updateUserRecipe(recipe.createdBy, recipeId, {
      images: {
        raster: {
          status: "generating",
        },
      },
    });

    // Generate PNG image with OpenAI
    const aiImageBuffer = await generateCocktailImage(recipe);
    let aiImageUrl: string | undefined = undefined;

    if (aiImageBuffer) {
      // Upload the PNG image to S3
      const s3Key = `images/${ulid()}.png`;
      const s3Result = await uploadImageToS3(
        aiImageBuffer,
        s3Key,
        "image/png",
      );
      aiImageUrl = s3Result.url;
      console.log(
        `[recipe-raster-image-job] PNG image generated and uploaded to S3 at`,
        aiImageUrl,
      );

      // Extract color palette — node-vibrant uses jimp which blocks the event
      // loop synchronously and hangs indefinitely on Deno Deploy, so skip it there.
      const isDenoDeployment = !!Deno.env.get("DENO_DEPLOYMENT_ID");
      const colorPalette = isDenoDeployment
        ? undefined
        : await extractColorPalette(aiImageBuffer);
      if (colorPalette) {
        console.log(
          `[recipe-raster-image-job] Color palette extracted:`,
          colorPalette,
        );
      } else if (!isDenoDeployment) {
        console.warn(
          `[recipe-raster-image-job] Failed to extract color palette`,
        );
      }

      // Update the recipe with the PNG image URL and color palette in the new images structure
      if (aiImageUrl) {
        const updatedImages = {
          raster: {
            url: aiImageUrl,
            status: "done" as const,
            error: undefined,
            colorPalette: colorPalette,
          },
          vector: recipe.images?.vector,
        };

        await recipeModel.updateUserRecipe(recipe.createdBy, recipeId, {
          images: updatedImages,
        });

        console.log(
          `[recipe-raster-image-job] Recipe raster image updated for ${recipeId}`,
        );

        // Enqueue a job to convert the image to SVG
        try {
          await enqueueJob({ type: "generate_recipe_vector_image", recipeId });
          console.log(
            `[recipe-raster-image-job] Enqueued vector conversion job for recipe ${recipeId}`,
          );
        } catch (err) {
          console.error(
            `[recipe-raster-image-job] Failed to enqueue vector conversion job:`,
            err,
          );
          // Continue with the PNG image even if we can't enqueue the vector job
        }
      }
    } else {
      console.warn(
        `[recipe-raster-image-job] No AI image generated for recipe ${recipeId}`,
      );
      return;
    }
  } catch (err) {
    console.error(
      `[recipe-raster-image-job] Failed to process image generation for recipe ${recipeId}:`,
      err,
    );
    throw err; // Rethrow to trigger automatic retry
  }
}
