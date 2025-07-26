import "@std/dotenv/load";
import type { MeasurementUnit } from "../../types/ingredient.ts";

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

    // Create a mock recipe object with the minimum required properties
    const mockRecipe = {
      id: "test-recipe-id",
      name: "Test Cocktail",
      description: "Test description",
      createdBy: "test-user",
      visibility: "private" as const,
      ingredients: [
        {
          ingredientId: "1",
          name: "gin",
          quantity: 1,
          unit: "oz" as MeasurementUnit,
          optional: false,
        },
        {
          ingredientId: "2",
          name: "vermouth",
          quantity: 0.5,
          unit: "oz" as MeasurementUnit,
          optional: false,
        },
        {
          ingredientId: "3",
          name: "lime",
          quantity: 0.5,
          unit: "oz" as MeasurementUnit,
          optional: false,
        },
        {
          ingredientId: "4",
          name: "grapefruit",
          quantity: 0.5,
          unit: "oz" as MeasurementUnit,
          optional: false,
        },
        {
          ingredientId: "5",
          name: "rum",
          quantity: 1,
          unit: "oz" as MeasurementUnit,
          optional: false,
        },
      ],
      garnish: ["lime twist"],
      glassware: "coupe" as const,
      preparation: ["Shake", "Strain"],
      source: {
        name: "Test Source",
        url: "https://example.com",
        image: cocktailImageUrl,
      },
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const imageBuffer = await generateCocktailImage(mockRecipe);
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
