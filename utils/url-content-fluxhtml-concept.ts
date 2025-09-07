// CONCEPTUAL MIGRATION: url-content.ts with FluxHTML
// This demonstrates what the migration would look like when @michaelhthomas/fluxhtml becomes available
// Currently uses conceptual API - will be updated when actual package is available

// NOTE: This is a demonstration of the migration pattern
// The actual implementation will use: import { parse, selectOne, selectAll, walkSync, getText, removeAttribute, removeElement, serialize } from "@michaelhthomas/fluxhtml";

import {
  parse,
  selectOne,
  selectAll,
  walkSync,
  getText,
  removeAttribute,
  removeElement,
  serialize,
  FluxHTMLNode,
  FluxHTMLElement,
  FluxHTMLText,
} from "./fluxhtml-concept.ts"; // Will be: "@michaelhthomas/fluxhtml"

import {
  extractRecipeFocusedContent,
  truncateContent,
} from "./ai/content-size.ts";

/**
 * Fetches the content of a URL and returns the raw HTML/text and content type.
 * Throws on network or HTTP errors.
 * (No changes needed - this function doesn't use DOM parsing)
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
 * MIGRATED: Extracts the main text content from HTML using FluxHTML.
 * Returns null if parsing fails or the content is not HTML.
 * For backward compatibility - consider using prepareHtmlForAI for recipe extraction.
 */
export function extractTextFromHtml(html: string): string | null {
  try {
    // MIGRATION: Replace DOMParser with FluxHTML parse()
    const nodes = parse(html);
    if (!nodes || nodes.length === 0) return null;

    // MIGRATION: Use FluxHTML selector instead of querySelector
    const bodyElement = selectOne(nodes, "body");
    if (!bodyElement) return null;

    // MIGRATION: Remove script/style tags using FluxHTML selectors
    const noiseElements = selectAll([bodyElement], "script, style, noscript");
    let cleanedBody = bodyElement;
    
    for (const element of noiseElements) {
      // MIGRATION: Use FluxHTML removeElement instead of element.remove()
      [cleanedBody] = removeElement([cleanedBody], element) as [FluxHTMLElement];
    }

    // MIGRATION: Use FluxHTML getText instead of textContent
    const text = getText(cleanedBody);
    return text?.replace(/\s+/g, " ").trim() || null;
  } catch (error) {
    console.error("Error extracting text with FluxHTML:", error);
    return null;
  }
}

// Element selectors that typically contain recipe noise/boilerplate
// (No changes needed - these are just selector strings)
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
 * (No changes needed - this function works with string parsing, not DOM manipulation)
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
 * (No changes needed - this is just an interface)
 */
export interface PrepareHtmlOptions {
  /** Maximum characters to return (will truncate intelligently if exceeded) */
  maxChars?: number;
}

/**
 * MIGRATED: Prepares HTML for AI recipe extraction by cleaning and optimizing the content.
 * Preserves semantic structure while removing noise elements like ads, navigation, and scripts.
 * Special handling for YouTube URLs to extract recipe data from player response.
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

    // MIGRATION: Replace DOMParser with FluxHTML parse()
    const nodes = parse(html);
    if (!nodes || nodes.length === 0) return null;

    // Note: FluxHTML doesn't support cloneNode directly, so we work with the original
    // and apply transformations carefully

    // Extract page title
    const titleElement = selectOne(nodes, "title");
    const title = titleElement ? getText(titleElement) : "";

    // MIGRATION: Remove noise elements using FluxHTML selectors
    let cleanedNodes = [...nodes];
    for (const selector of NOISE_SELECTORS) {
      const noiseElements = selectAll(cleanedNodes, selector);
      for (const element of noiseElements) {
        cleanedNodes = removeElement(cleanedNodes, element);
      }
    }

    // MIGRATION: Remove HTML comments using FluxHTML tree walking
    cleanedNodes = cleanedNodes.filter(node => {
      // FluxHTML would handle comment node filtering differently
      // This is conceptual - the actual implementation would use FluxHTML's comment handling
      return node.type !== 'comment';
    });

    // MIGRATION: Get the body content using FluxHTML selector
    const bodyContent = selectOne(cleanedNodes, "body");
    if (!bodyContent) return null;

    // MIGRATION: Strip verbose attributes using FluxHTML attribute manipulation
    stripVerboseAttributesFlux(bodyContent);

    // Build optimized content for AI processing
    let result = `<title>${title}</title>\n\n`;

    // MIGRATION: Add the body content using FluxHTML serialization
    result += serialize([bodyContent]);

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
    console.error("Error preparing HTML for AI with FluxHTML:", e);
    return null;
  }
}

/**
 * MIGRATED: Strips verbose attributes from HTML elements to reduce content size.
 * Preserves only essential attributes like src, href, alt, and title.
 * Updated to work with FluxHTML's ElementNode structure.
 */
function stripVerboseAttributesFlux(element: FluxHTMLElement): void {
  // List of attributes to preserve
  const preserveAttrs = new Set([
    "src",
    "data-src",
    "href",
    "alt",
    "title",
    "type",
  ]);

  // MIGRATION: Process current element using FluxHTML attribute handling
  if (element.attribs) {
    const attrsToRemove: string[] = [];

    for (const attrName of Object.keys(element.attribs)) {
      if (!preserveAttrs.has(attrName.toLowerCase())) {
        attrsToRemove.push(attrName);
      }
    }

    // MIGRATION: Remove non-essential attributes using FluxHTML
    for (const attrName of attrsToRemove) {
      removeAttribute(element, attrName);
    }
  }

  // MIGRATION: Recursively process child elements using FluxHTML tree structure
  if (element.children) {
    for (const child of element.children) {
      if (child.type === 'tag') {
        stripVerboseAttributesFlux(child as FluxHTMLElement);
      }
    }
  }
}