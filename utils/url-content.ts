// Utility for fetching and parsing URL content (AI-2, AI-3)
// Uses Deno's fetch and @michaelhthomas/fluxhtml for HTML processing

import {
  Node,
  parse,
  TEXT_NODE,
  transformSync,
  walkSync,
} from "@michaelhthomas/fluxhtml";
import { querySelector } from "@michaelhthomas/fluxhtml/selector";
import sanitize from "@michaelhthomas/fluxhtml/transformers/sanitize";
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
 * Extracts the main text content from HTML using FluxHTML.
 * Returns null if parsing fails or the content is not HTML.
 * For backward compatibility - consider using prepareHtmlForAI for recipe extraction.
 */
export function extractTextFromHtml(html: string): string | null {
  if (!html || !html.trim()) return null;

  try {
    // First, clean the HTML to remove script/style content
    const cleanedHtml = transformSync(html, [
      sanitize({
        dropElements: ["script", "style", "noscript"],
        allowComments: false,
      }),
    ]);

    const doc = parse(cleanedHtml);
    if (!doc) return null;

    // Find the body element first
    const body = querySelector(doc, "body");
    if (!body) return null;

    // Collect text content
    const textParts: string[] = [];
    walkSync(body, (node: Node) => {
      if (node.type === TEXT_NODE) {
        const text = node.value?.trim();
        if (text) {
          textParts.push(text);
        }
      }
      return true; // Continue walking
    });

    return textParts.join(" ").replace(/\s+/g, " ").trim() || null;
  } catch {
    return null;
  }
}

// Element selectors that typically contain recipe noise/boilerplate - kept for reference
const _NOISE_SELECTORS = [
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

    // Use FluxHTML's transformSync with sanitize to clean the HTML
    let cleanedHtml = transformSync(html, [
      sanitize({
        dropElements: [
          "script",
          "style",
          "noscript",
          "iframe",
          "nav",
          "aside",
          "header",
          "footer",
        ],
        allowComments: false,
      }),
    ]);

    // Manually remove HTML comments as a fallback (FluxHTML sanitizer may not handle them)
    cleanedHtml = cleanedHtml.replace(/<!--[\s\S]*?-->/g, "");

    // Additional cleanup for elements with noise classes/ids BEFORE stripping class attributes
    const noiseClassPatterns = ["comments", "sidebar", "ad"];
    for (const pattern of noiseClassPatterns) {
      // Remove elements with noise classes
      cleanedHtml = cleanedHtml.replace(
        new RegExp(
          `<div[^>]*class="[^"]*${pattern}[^"]*"[^>]*>.*?</div>`,
          "gis",
        ),
        "",
      );
      cleanedHtml = cleanedHtml.replace(
        new RegExp(
          `<aside[^>]*class="[^"]*${pattern}[^"]*"[^>]*>.*?</aside>`,
          "gis",
        ),
        "",
      );
    }

    // Manual attribute stripping since FluxHTML sanitizer doesn't seem to handle attribute filtering reliably
    // Remove style attributes
    cleanedHtml = cleanedHtml.replace(/\s+style="[^"]*"/gi, "");

    // Remove data-* attributes
    cleanedHtml = cleanedHtml.replace(/\s+data-[^=]*="[^"]*"/gi, "");

    // Remove class attributes
    cleanedHtml = cleanedHtml.replace(/\s+class="[^"]*"/gi, "");

    // Remove id attributes
    cleanedHtml = cleanedHtml.replace(/\s+id="[^"]*"/gi, "");

    // Remove other non-essential attributes while preserving essential ones
    cleanedHtml = cleanedHtml.replace(
      /\s+(?:target|rel|onload|onclick)="[^"]*"/gi,
      "",
    );

    if (!cleanedHtml) return null;

    // Apply size limit if specified
    if (options?.maxChars && cleanedHtml.length > options.maxChars) {
      console.log(
        `Content size (${cleanedHtml.length}) exceeds limit (${options.maxChars}), reducing...`,
      );

      // First try to extract just recipe-focused content
      const recipeFocused = extractRecipeFocusedContent(cleanedHtml);
      if (recipeFocused && recipeFocused.length <= options.maxChars) {
        return recipeFocused;
      }

      // Otherwise truncate intelligently
      return truncateContent(cleanedHtml, options.maxChars);
    }

    return cleanedHtml;
  } catch (e) {
    console.error("Error preparing HTML for AI:", e);
    return null;
  }
}
