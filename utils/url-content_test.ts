import { assert } from "@std/assert";
import { extractTextFromHtml, fetchUrlContent } from "./url-content.ts";

Deno.test({
  name: "fetchUrlContent fetches HTML and content type",
  async fn() {
    const { html, contentType, status } = await fetchUrlContent(
      "https://example.com/",
    );
    assert(
      typeof html === "string" && html.length > 0,
      "Should return HTML string",
    );
    assert(
      contentType.includes("text/html"),
      "Should detect HTML content type",
    );
    assert(status === 200, "Should return status 200");
  },
});

Deno.test({
  name: "extractTextFromHtml extracts main text from HTML",
  fn() {
    const html =
      `<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello World</h1><script>var x=1;</script></body></html>`;
    const text = extractTextFromHtml(html);
    assert(text?.includes("Hello World"), "Should extract visible text");
    assert(!text?.includes("var x=1"), "Should not include script content");
  },
});

Deno.test({
  name: "extractTextFromHtml returns null for invalid HTML",
  fn() {
    const text = extractTextFromHtml("");
    assert(text === null, "Should return null for empty input");
  },
});
