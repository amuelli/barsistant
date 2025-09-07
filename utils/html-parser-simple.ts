// Alternative HTML parsing implementation using native Deno capabilities
// This provides a working solution while we wait for @michaelhthomas/fluxhtml or similar packages

/**
 * Simple HTML text extraction using regex patterns
 * More performant than full DOM parsing for basic text extraction
 */
export function extractTextFromHtmlSimple(html: string): string | null {
  if (!html || !html.trim()) return null;

  try {
    // Remove script and style content first
    let cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

    // Extract body content if available
    const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      cleanHtml = bodyMatch[1];
    }

    // Remove all HTML tags and decode entities
    const text = cleanHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&[a-zA-Z0-9#]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text || null;
  } catch (error) {
    console.error("Error extracting text:", error);
    return null;
  }
}

/**
 * Simple HTML cleaning using regex patterns
 * Removes noise elements and attributes for AI processing
 */
export function prepareHtmlForAISimple(
  html: string,
  url?: string,
  options?: { maxChars?: number },
): string | null {
  if (!html || !html.trim()) return null;

  try {
    // Check if this is YouTube content (unchanged from original)
    const isYouTube = url?.includes("youtube.com") ||
      url?.includes("youtu.be") ||
      html.includes("ytInitialPlayerResponse") ||
      html.includes("www.youtube.com");

    // For YouTube, extract recipe data (this logic remains the same)
    if (isYouTube) {
      const youtubeData = extractYouTubeRecipeDataSimple(html);
      if (youtubeData) {
        return `<html>
          <head>
            <title>YouTube Recipe</title>
          </head>
          <body>
            ${youtubeData}
          </body>
        </html>`;
      }
    }

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Remove noise elements using regex
    let cleanHtml = html
      // Remove script and style tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      // Remove common noise elements
      .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, '')
      // Remove elements with noise classes/ids
      .replace(/<div[^>]*(?:class|id)="[^"]*(?:sidebar|comment|ad)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, '');

    // Extract body content
    const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : cleanHtml;

    // Strip verbose attributes (keep only essential ones)
    const cleanedBody = stripVerboseAttributesSimple(bodyContent);

    // Build result
    let result = `<title>${title}</title>\n\n<body>${cleanedBody}</body>`;

    // Apply size limit if specified
    if (options?.maxChars && result.length > options.maxChars) {
      // Simple truncation (more sophisticated truncation could be added)
      result = result.substring(0, options.maxChars) + '...';
    }

    return result;
  } catch (error) {
    console.error("Error preparing HTML:", error);
    return null;
  }
}

/**
 * Extract YouTube recipe data (unchanged from original implementation)
 */
function extractYouTubeRecipeDataSimple(html: string): string | null {
  try {
    const match = html.match(
      /var\s+ytInitialPlayerResponse\s*=\s*({.*?});/s,
    );

    if (!match || !match[1]) return null;

    try {
      const cleanedJson = match[1]
        .replace(/\\x[0-9a-fA-F]{2}/g, "")
        .replace(/\\u[0-9a-fA-F]{4}/g, "")
        .replace(/'/g, "'")
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

      let data;
      try {
        data = JSON.parse(cleanedJson);
      } catch (_jsonError) {
        console.warn("Could not parse YouTube JSON, falling back to regex extraction");
        const titleMatch = html.match(/\"title\":\s*{\s*\"simpleText\":\s*\"([^"]+)\"/);
        const descriptionMatch = html.match(/\"description\":\s*{\s*\"simpleText\":\s*\"([^"]+)\"/);
        const channelMatch = html.match(/\"ownerChannelName\":\s*\"([^"]+)\"/);

        if (!titleMatch && !descriptionMatch) return null;

        return `<div class="youtube-recipe-data">
          <h1>${titleMatch?.[1] || "YouTube Recipe"}</h1>
          <p class="meta">By ${channelMatch?.[1] || "Unknown"}</p>
          <div class="recipe-description">
            ${(descriptionMatch?.[1] || "").split("\\n").map((line: string) => `<p>${line}</p>`).join("")}
          </div>
        </div>`;
      }

      const microformat = data.microformat?.playerMicroformatRenderer;
      if (!microformat) return null;

      const title = microformat.title?.simpleText || "";
      const description = microformat.description?.simpleText || "";
      const thumbnail = microformat.thumbnail?.thumbnails?.[0]?.url || "";
      const channelName = microformat.ownerChannelName || "";
      const uploadDate = microformat.uploadDate || "";

      const recipeHTML = `<div class="youtube-recipe-data">
        <h1>${title}</h1>
        <p class="meta">By ${channelName}, uploaded on ${uploadDate}</p>
        ${thumbnail ? `<img src="${thumbnail}" alt="${title}" />` : ""}
        <div class="recipe-description">
          ${description.split("\n").map((line: string) => `<p>${line}</p>`).join("")}
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
 * Strip verbose attributes using regex
 * Keeps only essential attributes: src, data-src, href, alt, title, type
 */
function stripVerboseAttributesSimple(html: string): string {
  return html.replace(/<(\w+)([^>]*)>/g, (match, tagName, attributes) => {
    if (!attributes) return match;

    // Extract essential attributes
    const essentialAttribs: string[] = [];
    const attrRegex = /(\w+)=["']([^"']*)["']/g;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(attributes)) !== null) {
      const [, name, value] = attrMatch;
      if (['src', 'data-src', 'href', 'alt', 'title', 'type'].includes(name.toLowerCase())) {
        essentialAttribs.push(`${name}="${value}"`);
      }
    }

    return `<${tagName}${essentialAttribs.length ? ' ' + essentialAttribs.join(' ') : ''}>`;
  });
}