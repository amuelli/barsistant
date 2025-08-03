/**
 * Utilities for managing content size and token estimation
 * for AI model API calls
 */

/**
 * Estimates the approximate token count for a given text.
 * Uses the rough approximation of 1 token ≈ 4 characters for English text.
 * This is a conservative estimate that works well for GPT models.
 *
 * @param text The text to estimate tokens for
 * @returns Estimated number of tokens
 */
export function estimateTokenCount(text: string): number {
  // GPT tokenization roughly: 1 token ≈ 4 characters for English
  // We use 4 as it's a conservative estimate
  return Math.ceil(text.length / 4);
}

/**
 * Checks if content exceeds the safe token limit for API calls.
 * Default limit is set conservatively to leave room for system prompt
 * and response tokens.
 *
 * @param text The text to check
 * @param maxTokens Maximum allowed tokens (default: 7500 for safety with 30k limit)
 * @returns true if content is too large
 */
export function isContentTooLarge(text: string, maxTokens = 7500): boolean {
  return estimateTokenCount(text) > maxTokens;
}

/**
 * Calculates the safe character limit based on token constraints.
 *
 * @param maxTokens Maximum allowed tokens
 * @returns Maximum number of characters
 */
export function getMaxCharsForTokens(maxTokens: number): number {
  return maxTokens * 4; // 1 token ≈ 4 characters
}

/**
 * Truncates content intelligently to fit within token limits.
 * Tries to preserve complete sentences and HTML structure where possible.
 *
 * @param content The content to truncate
 * @param maxChars Maximum character limit
 * @returns Truncated content
 */
export function truncateContent(content: string, maxChars: number): string {
  if (content.length <= maxChars) {
    return content;
  }

  // Try to truncate at a reasonable boundary (sentence, tag, or word)
  let truncated = content.substring(0, maxChars);

  // Look for a good truncation point (in order of preference)
  const boundaries = [
    { marker: "</article>", offset: 10 }, // End of article tag
    { marker: "</div>", offset: 6 }, // End of div
    { marker: "</p>", offset: 4 }, // End of paragraph
    { marker: ". ", offset: 2 }, // End of sentence
    { marker: " ", offset: 1 }, // End of word
  ];

  for (const { marker, offset } of boundaries) {
    const lastIndex = truncated.lastIndexOf(marker);
    if (lastIndex > maxChars * 0.8) { // Only if we're keeping at least 80% of target
      truncated = truncated.substring(0, lastIndex + offset);
      break;
    }
  }

  return truncated;
}

/**
 * Extracts recipe-focused content from HTML by looking for
 * recipe-related sections and removing everything else.
 *
 * @param html The HTML content
 * @returns Recipe-focused HTML or null if no recipe sections found
 */
export function extractRecipeFocusedContent(html: string): string | null {
  // Look for recipe-specific markers
  const recipeMarkers = [
    /<article[^>]*class="[^"]*recipe[^"]*"[^>]*>[\s\S]*?<\/article>/gi,
    /<div[^>]*class="[^"]*recipe[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    /<main[^>]*>[\s\S]*?<\/main>/gi,
    /<section[^>]*class="[^"]*recipe[^"]*"[^>]*>[\s\S]*?<\/section>/gi,
  ];

  for (const marker of recipeMarkers) {
    const matches = html.match(marker);
    if (matches && matches.length > 0) {
      // Found recipe content, return it with minimal wrapper
      return `<html><body>${matches.join("\n")}</body></html>`;
    }
  }

  // Fallback: look for ingredient and instruction keywords
  if (html.match(/ingredients|instructions|recipe|cocktail/i)) {
    // Extract content around these keywords
    const start = Math.max(
      0,
      html.search(/ingredients|instructions|recipe|cocktail/i) - 500,
    );
    const extract = html.substring(start, start + getMaxCharsForTokens(7500));
    return `<html><body>${extract}</body></html>`;
  }

  return null;
}

/**
 * Provides metrics about content size for logging and debugging
 */
export interface ContentSizeMetrics {
  originalSize: number;
  processedSize: number;
  estimatedTokens: number;
  reductionPercent: number;
  isWithinLimit: boolean;
}

/**
 * Calculates size metrics for content transformation
 *
 * @param original Original content
 * @param processed Processed content
 * @param tokenLimit Token limit to check against
 * @returns Size metrics
 */
export function calculateSizeMetrics(
  original: string,
  processed: string,
  tokenLimit = 7500,
): ContentSizeMetrics {
  const originalSize = original.length;
  const processedSize = processed.length;
  const estimatedTokens = estimateTokenCount(processed);
  const reductionPercent = Math.round(
    ((originalSize - processedSize) / originalSize) * 100,
  );

  return {
    originalSize,
    processedSize,
    estimatedTokens,
    reductionPercent,
    isWithinLimit: estimatedTokens <= tokenLimit,
  };
}
