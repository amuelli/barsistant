// Utility for fetching and parsing URL content (AI-2, AI-3)
// Uses Deno's fetch and @b-fuze/deno-dom for HTML processing

import { DOMParser, Element, HTMLDocument, Node } from "@b-fuze/deno-dom";
import {
  extractRecipeFocusedContent,
  truncateContent,
} from "./ai/content-size.ts";

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
 * Extracts YouTube recipe data from ytInitialPlayerResponse object
 *
 * @param html The raw HTML from YouTube
 * @returns Structured HTML with recipe information, or null if extraction fails
 */
function extractYouTubeRecipeData(html: string): string | null {
  try {
    // Find the ytInitialPlayerResponse object in the script
    const match = html.match(
      /var\s+ytInitialPlayerResponse\s*=\s*({.*?});/s,
    );

    if (!match || !match[1]) return null;

    try {
      // Try to parse the JSON object, making it more robust
      // First, attempt to fix common JSON issues in the matched string
      const cleanedJson = match[1]
        .replace(/\\x[0-9a-fA-F]{2}/g, "") // Remove escaped hex characters
        .replace(/\\u[0-9a-fA-F]{4}/g, "") // Handle Unicode escapes
        .replace(/'/g, "'") // Replace single quotes with appropriate ones if needed
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // Ensure property names are quoted

      let data;
      try {
        // Try to parse the cleaned JSON
        data = JSON.parse(cleanedJson);
      } catch (_jsonError) {
        // If that fails, try a more aggressive approach using a simplified regex extraction
        console.warn(
          "Could not parse YouTube JSON, falling back to regex extraction",
        );
        // Extract title and description directly
        const titleMatch = html.match(
          /\"title\":\s*{\s*\"simpleText\":\s*\"([^"]+)\"/,
        );
        const descriptionMatch = html.match(
          /\"description\":\s*{\s*\"simpleText\":\s*\"([^"]+)\"/,
        );
        const channelMatch = html.match(/\"ownerChannelName\":\s*\"([^"]+)\"/);

        if (!titleMatch && !descriptionMatch) return null;

        // Create a simplified data structure
        return `<div class="youtube-recipe-data">
          <h1>${titleMatch?.[1] || "YouTube Recipe"}</h1>
          <p class="meta">By ${channelMatch?.[1] || "Unknown"}</p>
          <div class="recipe-description">
            ${
          (descriptionMatch?.[1] || "").split("\\n").map((line: string) =>
            `<p>${line}</p>`
          ).join("")
        }
          </div>
        </div>`;
      }

      // Extract important recipe information
      const microformat = data.microformat?.playerMicroformatRenderer;
      if (!microformat) return null;

      const title = microformat.title?.simpleText || "";
      const description = microformat.description?.simpleText || "";
      const thumbnail = microformat.thumbnail?.thumbnails?.[0]?.url || "";
      const channelName = microformat.ownerChannelName || "";
      const uploadDate = microformat.uploadDate || "";

      // Format the data in a recipe-friendly HTML structure
      const recipeHTML = `<div class="youtube-recipe-data">
        <h1>${title}</h1>
        <p class="meta">By ${channelName}, uploaded on ${uploadDate}</p>
        ${thumbnail ? `<img src="${thumbnail}" alt="${title}" />` : ""}
        <div class="recipe-description">
          ${
        description.split("\n").map((line: string) => `<p>${line}</p>`).join("")
      }
        </div>
      </div>`;

      return recipeHTML;
    } catch (jsonError) {
      console.error("Error parsing YouTube data:", jsonError);
      return null;
    }
  } catch (e) {
    console.error("Error extracting YouTube recipe data:", e);
    return null;
  }
}

/**
 * Options for HTML preparation
 */
export interface PrepareHtmlOptions {
  /** Maximum characters to return (will truncate intelligently if exceeded) */
  maxChars?: number;
}

/**
 * Prepares HTML for AI recipe extraction by cleaning and optimizing the content.
 * Preserves semantic structure while removing noise elements like ads, navigation, and scripts.
 * Special handling for YouTube URLs to extract recipe data from player response.
 *
 * @param html The raw HTML string
 * @param url Optional URL to identify source type (e.g., YouTube)
 * @param options Optional configuration for content processing
 * @returns Processed HTML with noise elements removed, or null if parsing fails
 */
export function prepareHtmlForAI(
  html: string,
  url?: string,
  options?: PrepareHtmlOptions,
): string | null {
  // Handle empty input explicitly
  if (!html || !html.trim()) return null;

  try {
    // Check if this is YouTube content
    const isYouTube = url?.includes("youtube.com") ||
      url?.includes("youtu.be") ||
      html.includes("ytInitialPlayerResponse") ||
      html.includes("www.youtube.com");

    // For YouTube, try to extract recipe data from player response first
    if (isYouTube) {
      const youtubeData = extractYouTubeRecipeData(html);
      if (youtubeData) {
        // Create a simplified HTML document with the extracted YouTube data
        return `<html>
          <head>
            <title>YouTube Recipe</title>
          </head>
          <body>
            ${youtubeData}
          </body>
        </html>`;
      }
      // If extraction fails, fall back to standard processing
    }

    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) return null;

    const clone = doc.cloneNode(true) as HTMLDocument;

    // Extract page title
    const title = clone.querySelector("title")?.textContent || "";

    // Remove noise elements
    NOISE_SELECTORS.forEach((selector) => {
      clone.querySelectorAll(selector).forEach((el) => el.remove());
    });

    // Remove HTML comments
    const removeComments = (node: Element | HTMLDocument) => {
      const toRemove: Node[] = [];
      for (const child of node.childNodes) {
        if (child.nodeType === 8) { // Comment node
          toRemove.push(child);
        } else if (child.childNodes) {
          removeComments(child as Element);
        }
      }
      toRemove.forEach((comment) => {
        if (comment.parentNode) {
          comment.parentNode.removeChild(comment);
        }
      });
    };
    removeComments(clone);

    // Get the body content
    const bodyContent = clone.querySelector("body");
    if (!bodyContent) return null;

    // Strip verbose attributes from all elements to reduce size
    stripVerboseAttributes(bodyContent);

    // Build optimized content for AI processing
    let result = `<title>${title}</title>\n\n`;

    // Add the body content
    result += bodyContent.outerHTML;

    // Apply size limit if specified
    if (options?.maxChars && result.length > options.maxChars) {
      console.log(
        `Content size (${result.length}) exceeds limit (${options.maxChars}), reducing...`,
      );

      // First try to extract just recipe-focused content
      const recipeFocused = extractRecipeFocusedContent(result);
      if (recipeFocused && recipeFocused.length <= options.maxChars) {
        return recipeFocused;
      }

      // Otherwise truncate intelligently
      result = truncateContent(result, options.maxChars);
    }

    return result;
  } catch (e) {
    console.error("Error preparing HTML for AI:", e);
    return null;
  }
}

/**
 * Strips verbose attributes from HTML elements to reduce content size.
 * Preserves only essential attributes like src, href, alt, and title.
 *
 * @param element The DOM element to process recursively
 */
function stripVerboseAttributes(element: Element): void {
  // List of attributes to preserve
  const preserveAttrs = new Set([
    "src",
    "data-src",
    "href",
    "alt",
    "title",
    "type",
  ]);

  // Process current element
  if (element.attributes) {
    const attrsToRemove: string[] = [];

    for (const attr of element.attributes) {
      if (!preserveAttrs.has(attr.name.toLowerCase())) {
        attrsToRemove.push(attr.name);
      }
    }

    // Remove non-essential attributes
    for (const attrName of attrsToRemove) {
      element.removeAttribute(attrName);
    }
  }

  // Recursively process child elements
  for (const child of element.children) {
    if (child instanceof Element) {
      stripVerboseAttributes(child);
    }
  }
}
