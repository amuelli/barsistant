/**
 * Color extraction utilities for Barsistant
 *
 * This module provides functionality to extract dominant colors from recipe images
 * using the node-vibrant library.
 */

import { Buffer } from "node:buffer";
import { Vibrant } from "node-vibrant/node";
import { ColorPalette } from "../../types/recipe.ts";

/**
 * Extract a color palette from an image buffer
 *
 * @param imageBuffer The image data as Uint8Array
 * @returns A promise resolving to the ColorPalette or undefined if extraction fails
 */
export async function extractColorPalette(
  imageBuffer: Uint8Array,
): Promise<ColorPalette | undefined> {
  try {
    console.log("[color-extraction] Extracting color palette from image");

    // Process the image with node-vibrant directly from buffer
    // Convert Uint8Array to Buffer for node-vibrant
    const buffer = Buffer.from(imageBuffer);

    // Process the image with node-vibrant
    const palette = await Vibrant.from(buffer).getPalette();

    // Map the vibrant palette to our ColorPalette type
    const colorPalette: ColorPalette = {
      vibrant: palette.Vibrant?.hex,
      darkVibrant: palette.DarkVibrant?.hex,
      lightVibrant: palette.LightVibrant?.hex,
      muted: palette.Muted?.hex,
      darkMuted: palette.DarkMuted?.hex,
      lightMuted: palette.LightMuted?.hex,
    };

    console.log("[color-extraction] Extracted palette:", colorPalette);
    return colorPalette;
  } catch (error) {
    console.error("[color-extraction] Failed to extract color palette:", error);
    return undefined;
  }
}
