// Utility for fetching and parsing URL content (AI-2, AI-3)
// Uses Deno's fetch and @b-fuze/deno-dom for HTML processing

import { DOMParser, HTMLDocument } from "@b-fuze/deno-dom";

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
 * For backward compatibility - consider using prepareHtmlForAI for recipe extraction.
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

// Element selectors that typically contain recipe noise/boilerplate
const NOISE_SELECTORS = [
  "header:not(article header, main header)",
  "footer:not(article footer, main footer)",
  "nav",
  "aside",
  "div[class*='sidebar']",
  "div[class*='comment']",
  "div[class*='ad']",
  "div[id*='sidebar']",
  "div[id*='comment']",
  "div[id*='ad']",
  "script",
  "style",
  "noscript",
  "iframe",
];

/**
 * Prepares HTML for AI recipe extraction by cleaning and optimizing the content.
 * Preserves semantic structure while removing noise elements like ads, navigation, and scripts.
 *
 * @param html The raw HTML string
 * @returns Processed HTML with noise elements removed, or null if parsing fails
 */
export function prepareHtmlForAI(html: string): string | null {
  // Handle empty input explicitly
  if (!html || !html.trim()) return null;

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) return null;

    const clone = doc.cloneNode(true) as HTMLDocument;

    // Extract page title
    const title = clone.querySelector("title")?.textContent || "";

    // Remove noise elements
    NOISE_SELECTORS.forEach((selector) => {
      clone.querySelectorAll(selector).forEach((el) => el.remove());
    });

    // Get the body content
    const bodyContent = clone.querySelector("body");
    if (!bodyContent) return null;

    // Build optimized content for AI processing
    let result = `<title>${title}</title>\n\n`;

    // Add the body content
    result += bodyContent.outerHTML;

    return result;
  } catch (e) {
    console.error("Error preparing HTML for AI:", e);
    return null;
  }
}
