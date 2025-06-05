// Utility for fetching and parsing URL content (AI-2, AI-3)
// Uses Deno's fetch and @b-fuze/deno-dom for HTML processing

import { DOMParser, Element, HTMLDocument } from "@b-fuze/deno-dom";

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

// Common selectors for recipe content on various websites
const RECIPE_SELECTORS = [
  "article",
  "main",
  "div[class*='recipe']",
  "div[class*='content']",
  "div[id*='recipe']",
  "div[id*='content']",
  "div[itemtype*='Recipe']",
];

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
 * Extracts structured recipe data (JSON-LD) from the HTML if available.
 *
 * @param doc The HTML Document object
 * @returns JSON-LD recipe data as a string or null if not found
 */
function extractStructuredRecipeData(doc: HTMLDocument): string | null {
  try {
    const jsonldScripts = Array.from(doc.querySelectorAll(
      "script[type='application/ld+json']",
    ));

    for (const script of jsonldScripts) {
      const content = script.textContent;
      if (!content) continue;

      try {
        const jsonData = JSON.parse(content);

        // Look for Recipe type in various JSON-LD structures
        if (
          jsonData["@type"] === "Recipe" ||
          (jsonData["@graph"] &&
            jsonData["@graph"].some((item: any) => item["@type"] === "Recipe"))
        ) {
          return content;
        }
      } catch (e) {
        // Ignore JSON parse errors and continue checking other scripts
        continue;
      }
    }
  } catch (e) {
    console.error("Error extracting structured recipe data:", e);
  }

  return null;
}

/**
 * Prepares HTML for AI recipe extraction by cleaning and optimizing the content.
 * Preserves semantic structure while removing noise, and includes structured data if available.
 *
 * @param html The raw HTML string
 * @returns Processed HTML optimized for AI recipe extraction, or null if parsing fails
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

    // Extract recipe metadata if available
    const structuredData = extractStructuredRecipeData(clone);

    // Remove noise elements
    NOISE_SELECTORS.forEach((selector) => {
      clone.querySelectorAll(selector).forEach((el) => el.remove());
    });

    // Get the main recipe content
    let mainContent: Element | null = null;

    // Try to find main recipe content by checking recipe-specific selectors
    for (const selector of RECIPE_SELECTORS) {
      const elements = clone.querySelectorAll(selector);
      if (elements.length > 0) {
        // If multiple elements match, take the largest one (likely the main content)
        let largestEl = elements[0];
        let maxLength = elements[0].textContent?.length || 0;

        for (const el of Array.from(elements)) {
          const length = el.textContent?.length || 0;
          if (length > maxLength) {
            maxLength = length;
            largestEl = el;
          }
        }

        mainContent = largestEl;
        break;
      }
    }

    // If no recipe-specific content found, use the body
    if (!mainContent) {
      mainContent = clone.querySelector("body");
      if (!mainContent) return null;
    }

    // Build optimized content for AI processing
    let result = `<title>${title}</title>\n\n`;

    // Add structured data if found
    if (structuredData) {
      result += `<structured-data>${structuredData}</structured-data>\n\n`;
    }

    // Add the main content
    result += mainContent.outerHTML;

    return result;
  } catch (e) {
    console.error("Error preparing HTML for AI:", e);
    return null;
  }
}
