/**
 * Tests for the recraft.ai image vectorization
 *
 * These tests verify the integration with recraft.ai for converting
 * raster images to vector (SVG) format.
 */

import { assertEquals, assertExists } from "@std/assert";
import "@std/dotenv/load";
import { vectorizeImage } from "./recraft.ts";

// Configure test execution
const RUN_RECRAFT_TESTS = Deno.env.get("RUN_RECRAFT_TESTS") === "1";

Deno.test({
  name: "vectorizeImage converts a raster image to SVG",
  ignore: !Deno.env.get("RECRAFT_API_TOKEN") || !RUN_RECRAFT_TESTS,
  async fn() {
    // For this test, we need a sample cocktail image
    // We'll use a local cocktail image file
    const imagePath = new URL(
      "../../test-data/blood-orange-margarita.png",
      import.meta.url,
    );

    try {
      // Read the test image file
      const imageBuffer = await Deno.readFile(imagePath);
      console.log(`Test image size: ${imageBuffer.length} bytes`);

      // Test vectorization
      const result = await vectorizeImage(imageBuffer);
      assertExists(result, "Vector image should be generated");
      assertEquals(result?.contentType, "image/svg+xml");
      console.log(`Generated SVG size: ${result!.data.length} bytes`);

      // Basic size validation
      if (result!.data.length < 1000) {
        throw new Error("SVG is suspiciously small, may indicate an error");
      }
    } catch (error) {
      console.error("Test failed:", error);
      throw error;
    }
  },
});
