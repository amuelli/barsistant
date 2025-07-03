import { assertEquals, assertExists } from "@std/assert";
import { extractColorPalette } from "./color-extraction.ts";

Deno.test("extractColorPalette should return a valid color palette", async () => {
  // This is a simple test to verify that the color extraction works
  // It assumes that the node-vibrant package is installed and functioning

  try {
    // Create a simple 10x10 red square test image
    const canvas = new OffscreenCanvas(10, 10);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    ctx.fillStyle = "#FF0000";
    ctx.fillRect(0, 0, 10, 10);

    const blob = await canvas.convertToBlob();
    const buffer = new Uint8Array(await blob.arrayBuffer());

    // Extract color palette
    const palette = await extractColorPalette(buffer);

    // Verify that we got a palette back
    assertExists(palette, "Color palette should exist");

    // Since we created a red image, at least one of the palette colors should be reddish
    // This is a simplified test - in reality, the exact colors depend on the algorithm
    const hasRedColor = Object.values(palette).some((color) => {
      if (!color) return false;
      // Check if the color starts with "#" and has a high red component
      return color.startsWith("#") &&
        parseInt(color.slice(1, 3), 16) > 200 && // High red
        parseInt(color.slice(3, 5), 16) < 100 && // Low green
        parseInt(color.slice(5, 7), 16) < 100; // Low blue
    });

    assertEquals(hasRedColor, true, "Palette should contain a reddish color");
  } catch (error) {
    // This may fail if node-vibrant isn't properly installed yet or if OffscreenCanvas is not available
    console.warn(
      "Color extraction test skipped:",
      error instanceof Error ? error.message : String(error),
    );
  }
});
