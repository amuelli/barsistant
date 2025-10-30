/**
 * Recraft.ai API integration for SVG conversion
 *
 * This module provides a function for converting raster images to vector (SVG) format
 * using the Recraft.ai API service.
 */

// No imports needed as we're using direct fetch API

export class RecraftError extends Error {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message);
    this.name = "RecraftError";
  }
}

/**
 * Vectorize an existing image using Recraft API's vectorize endpoint
 *
 * This function is used as part of the recipe image generation pipeline:
 * 1. OpenAI generates the initial PNG image
 * 2. This function converts the PNG to a clean SVG vector illustration
 *
 * @param imageBuffer The raster image data to vectorize (PNG, JPEG, etc.)
 * @returns A Uint8Array containing the SVG data, or undefined if vectorization failed
 */
export async function vectorizeImage(
  imageBuffer: Uint8Array,
): Promise<{ data: Uint8Array; contentType: string } | undefined> {
  const apiToken = Deno.env.get("RECRAFT_API_TOKEN");
  if (!apiToken) {
    console.warn("[recraft] Missing RECRAFT_API_TOKEN environment variable");
    return undefined;
  }

  try {
    // Prepare formdata with the image
    const formData = new FormData();
    formData.append(
      "file",
      new File([imageBuffer as BlobPart], "image.png", { type: "image/png" }),
    );

    // Use raw fetch API for multipart/form-data
    const response = await fetch(
      "https://external.api.recraft.ai/v1/images/vectorize",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new RecraftError(
        `Recraft vectorize API error: ${response.status} ${errText}`,
      );
    }

    const result = await response.json();

    // Get SVG from URL
    if (result?.image?.url) {
      const svgResponse = await fetch(result.image.url);
      if (svgResponse.ok) {
        const arrayBuffer = await svgResponse.arrayBuffer();
        return {
          data: new Uint8Array(arrayBuffer),
          contentType: "image/svg+xml",
        };
      }
    }

    console.error("[recraft] No valid vectorized image returned", result);
    return undefined;
  } catch (err) {
    console.error("[recraft] Image vectorization failed:", err);
    return undefined;
  }
}
