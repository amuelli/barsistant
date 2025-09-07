// Improved HTML parsing implementation using native Deno capabilities
// This provides better performance than @b-fuze/deno-dom while maintaining compatibility
// Can be easily migrated to @michaelhthomas/fluxhtml when available

import {
  extractTextFromHtmlSimple,
  prepareHtmlForAISimple,
} from "./html-parser-simple.ts";
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
 * IMPROVED: Extracts the main text content from HTML using efficient regex-based parsing.
 * Returns null if parsing fails or the content is not HTML.
 * For backward compatibility - consider using prepareHtmlForAI for recipe extraction.
 * 
 * Performance improvements:
 * - Uses regex instead of full DOM parsing for faster processing
 * - Smaller memory footprint
 * - No external dependencies
 */
export function extractTextFromHtml(html: string): string | null {
  return extractTextFromHtmlSimple(html);
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
 * IMPROVED: Prepares HTML for AI recipe extraction by cleaning and optimizing the content.
 * Preserves semantic structure while removing noise elements like ads, navigation, and scripts.
 * Special handling for YouTube URLs to extract recipe data from player response.
 *
 * Performance improvements:
 * - Uses efficient regex-based cleaning instead of DOM manipulation
 * - Faster processing of large HTML documents
 * - Reduced memory usage
 * - Better attribute stripping performance
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
    // Use improved simple HTML processing
    const result = prepareHtmlForAISimple(html, url, options);

    if (!result) return null;

    // Apply advanced content size management if needed
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
      return truncateContent(result, options.maxChars);
    }

    return result;
  } catch (e) {
    console.error("Error preparing HTML for AI:", e);
    return null;
  }
}

/**
 * Legacy compatibility function - maps to improved implementation
 * This ensures existing code continues to work while using improved parsing
 */
export function stripVerboseAttributes(element: any): void {
  // This function signature is maintained for compatibility
  // The actual attribute stripping is now done in prepareHtmlForAI
  console.warn("stripVerboseAttributes is deprecated - attribute stripping is now handled automatically in prepareHtmlForAI");
}