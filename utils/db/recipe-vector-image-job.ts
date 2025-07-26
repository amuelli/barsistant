/**
 * This module provides job handling for converting recipe PNG images to SVG vector format
 * using the Recraft API's vectorization endpoint.
 */

import { ulid } from "@std/ulid";
import { z } from "zod";
import { vectorizeImage } from "../ai/recraft.ts";
import { uploadImageToS3 } from "../storage/s3.ts";
import { DatabaseError } from "./db.ts";
import { recipeModel } from "./recipe-model.ts";

export const GenerateRecipeVectorImageJobSchema = z.object({
  type: z.literal("generate_recipe_vector_image"),
  recipeId: z.string(),
});
export type GenerateRecipeVectorImageJob = z.infer<
  typeof GenerateRecipeVectorImageJobSchema
>;

export const isGenerateRecipeVectorImageJob = (
  msg: unknown,
): msg is GenerateRecipeVectorImageJob =>
  GenerateRecipeVectorImageJobSchema.safeParse(msg).success;

/**
 * Handles vector image conversion for recipe raster images
 *
 * This handler:
 * 1. Fetches the recipe by ID
 * 2. Fetches the existing PNG image
 * 3. Converts it to SVG format using Recraft AI
 * 4. Uploads the SVG to S3
 * 5. Updates the recipe record with the SVG image URL
 */
export async function handleGenerateRecipeVectorImageJob(
  job: GenerateRecipeVectorImageJob,
) {
  const { recipeId } = job;
  try {
    // Use recipeModel.getById instead of recipes.get
    const recipe = await recipeModel.getById(recipeId);
    if (!recipe) {
      throw new DatabaseError(`Recipe not found: ${recipeId}`);
    }

    // Skip if the recipe doesn't have any image to convert
    if (!recipe.images?.raster) {
      console.log(
        `[recipe-vector-image-job] Recipe ${recipeId} has no image to convert, skipping.`,
      );
      return;
    }

    // Set image generation status to vector generating
    await recipeModel.updateUserRecipe(recipe.createdBy, recipeId, {
      images: {
        raster: recipe.images?.raster,
        vector: {
          status: "generating",
        },
      },
    });

    // Fetch the existing image (prefer PNG from images object if available)
    console.log(
      `[recipe-vector-image-job] Fetching existing image for recipe ${recipeId}`,
    );
    let imageBuffer: Uint8Array;
    try {
      // Prefer the PNG image from the images object, fall back to legacy image field
      const imageUrl = recipe.images?.raster?.url;

      if (!imageUrl) {
        throw new Error("No image URL found in recipe");
      }

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }

      imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());
      console.log(
        `[recipe-vector-image-job] Fetched image from ${imageUrl} (${imageBuffer.length} bytes)`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.error(
        `[recipe-vector-image-job] Failed to fetch image: ${errorMessage}`,
      );
      return;
    }

    // Convert the image to SVG
    console.log(`[recipe-vector-image-job] Converting image to SVG`);
    const vectorizedImage = await vectorizeImage(imageBuffer);

    if (!vectorizedImage) {
      console.error(
        `[recipe-vector-image-job] Vectorization failed for recipe ${recipeId}`,
      );
      return;
    }

    // Upload the SVG to S3
    const s3Key = `images/${ulid()}.svg`;
    const s3Result = await uploadImageToS3(
      vectorizedImage.data,
      s3Key,
      vectorizedImage.contentType,
    );

    console.log(
      `[recipe-vector-image-job] Vector image uploaded to S3 at ${s3Result.url}`,
    );

    // Update the recipe with the SVG image URL in the images structure
    const updatedImages = {
      raster: recipe.images?.raster,
      vector: {
        url: s3Result.url,
        status: "done" as const,
        error: undefined,
      },
    };

    // Update the recipe with the vector images
    await recipeModel.updateUserRecipe(recipe.createdBy, recipeId, {
      images: updatedImages,
    });

    console.log(
      `[recipe-vector-image-job] Recipe updated with vector image for ${recipeId}`,
    );
  } catch (err) {
    console.error(
      `[recipe-vector-image-job] Failed to process vector image for recipe ${recipeId}:`,
      err,
    );
    throw err; // Rethrow to trigger automatic retry
  }
}
