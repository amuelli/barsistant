import OpenAI from "jsr:@openai/openai";

export async function generateCocktailImage(
  recipeName: string,
  ingredients: string[],
  cocktailImageUrl?: string,
): Promise<Uint8Array | undefined> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return undefined;

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
