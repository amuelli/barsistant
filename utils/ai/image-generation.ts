import OpenAI from "@openai/openai";
import type { Recipe } from "../../types/recipe.ts";

export async function generateCocktailImage(
  recipe: Recipe,
): Promise<Uint8Array | undefined> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return undefined;

  const recipeName = recipe.name;
  const cocktailImageUrl = recipe.source?.image;
  const garnish = recipe.garnish;
  const glassware = recipe.glassware;

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
    `Simple, minimalist vector illustration of a ${recipeName} cocktail in a ${glassware} glass${
      garnish && garnish.length > 0 ? ` with ${garnish.join(", ")}` : ""
    }.
    Draw the ${glassware} glass using simple black strokes, but include dimension by showing an oval opening at the top rather than a straight line. Add minimal shading or a second stroke to suggest depth. Fill the drink area with a color representing the cocktail. ${
      garnish && garnish.length > 0
        ? `Include ${
          garnish.join(", ")
        } as simple elements with slight dimensionality. `
        : ""
    }
    If the reference image shows ice cubes, represent them with subtle geometric shapes in lighter tones within the drink.
    
    If a reference image is provided, match the cocktail's color, basic presentation, and any visible ice. Use a clean icon style with black outlines and minimal colors. No text or labels. The illustration should have subtle dimension while still being simple enough to work as an icon, clearly recognizable as a ${recipeName} in a ${glassware} glass with an oval opening.`;

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
      response = await openai.images.generate({
        prompt,
        n: 1,
        model: "gpt-image-1",
        quality: "low",
        background: "transparent",
      });
    }
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
