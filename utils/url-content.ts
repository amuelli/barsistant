// Utility for fetching and parsing URL content (AI-2)
// Uses Deno's fetch and @b-fuze/deno-dom for HTML parsing

import { DOMParser } from "@b-fuze/deno-dom";

/**
 * Fetches the content of a URL and returns the raw HTML/text and content type.
 * Throws on network or HTTP errors.
 */
export async function fetchUrlContent(
  url: string,
): Promise<{ html: string; contentType: string; status: number }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "BarsistantBot/1.0 (+https://github.com/amuelli/barsistant)",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch URL (${res.status}): ${url}`);
  }
  const contentType = res.headers.get("content-type") || "";
  const html = await res.text();
  return { html, contentType, status: res.status };
}

/**
 * Extracts the main text content from HTML using deno-dom.
 * Returns null if parsing fails or the content is not HTML.
 */
export function extractTextFromHtml(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) return null;
  // Simple extraction: get all textContent from <body>
  const body = doc.querySelector("body");
  if (!body) return null;
  // Remove script/style tags for cleaner output
  body.querySelectorAll("script,style,noscript").forEach((el) => el.remove());
  return body.textContent?.replace(/\s+/g, " ").trim() || null;
}

// Optionally, add more advanced extraction (e.g., main/article selectors) later.
