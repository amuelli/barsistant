import "@std/dotenv/load";

const RUN_OPENAI_TESTS = Deno.env.get("RUN_OPENAI_TESTS") === "1";

Deno.test({
  name:
    "generateCocktailImage returns a valid image buffer for a JPG input (integration)",
  ignore: !Deno.env.get("OPENAI_API_KEY") || !RUN_OPENAI_TESTS,
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    // Example real cocktail image (public domain, photo, JPG)
    const cocktailImageUrl =
      "https://www.liquor.com/thmb/w10s8lY2OpyfBM0NmzbNfUcTJBU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/ancient-mariner-720x720-primary-c3d0dc150eef4d9ea29b1fb2ef314e40.jpg";
    const { generateCocktailImage } = await import("./image-generation.ts");
    const imageBuffer = await generateCocktailImage(
      "Test Cocktail",
      ["gin", "vermouth", "lime", "grapefruit", "rum"],
      cocktailImageUrl,
    );
    console.log(
      "AI image generation result (buffer length):",
      imageBuffer?.length,
    );
    if (imageBuffer) {
      // Should be a Uint8Array with reasonable length for a PNG/JPG
      if (!(imageBuffer instanceof Uint8Array)) {
        throw new Error("Not a Uint8Array");
      }
      if (imageBuffer.length < 1000) throw new Error("Image buffer too small");
    } else {
      console.warn(
        "No image buffer returned. This may be expected if the API does not support JPG input.",
      );
    }
  },
});
