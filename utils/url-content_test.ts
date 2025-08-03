import { assert, assertEquals } from "@std/assert";
import {
  extractTextFromHtml,
  fetchUrlContent,
  prepareHtmlForAI,
} from "./url-content.ts";

Deno.test({
  name: "fetchUrlContent fetches HTML and content type",
  ignore: true, // Skip network tests to avoid timeouts
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

Deno.test({
  name: "prepareHtmlForAI preserves semantic structure while removing noise",
  fn() {
    const html = `
      <!DOCTYPE html><html><head><title>Negroni Recipe</title></head>
      <body>
        <header>Website Header</header>
        <nav>Nav Links</nav>
        <aside>Sidebar Content</aside>
        <main>
          <article class="recipe-content">
            <h1>Classic Negroni</h1>
            <p>A perfect balance of gin, vermouth, and Campari.</p>
            <div class="ingredients">
              <h2>Ingredients</h2>
              <ul>
                <li>1 oz gin</li>
                <li>1 oz sweet vermouth</li>
                <li>1 oz Campari</li>
              </ul>
            </div>
            <div class="instructions">
              <h2>Instructions</h2>
              <ol>
                <li>Stir with ice</li>
                <li>Strain into rocks glass</li>
                <li>Garnish with orange peel</li>
              </ol>
            </div>
          </article>
        </main>
        <footer>Site Footer</footer>
        <script>var ads = loadAds();</script>
      </body>
      </html>
    `;

    const prepared = prepareHtmlForAI(html, "https://example.com/recipe");

    assert(prepared !== null, "Should return prepared HTML");
    assert(
      prepared?.includes("<title>Negroni Recipe</title>"),
      "Should preserve page title",
    );
    assert(
      prepared?.includes("<h1>Classic Negroni</h1>"),
      "Should preserve main content heading",
    );
    assert(
      prepared?.includes("<li>1 oz gin</li>"),
      "Should preserve ingredient list",
    );
    assert(
      prepared?.includes("Stir with ice"),
      "Should preserve instruction content",
    );

    assert(!prepared?.includes("Website Header"), "Should remove header");
    assert(!prepared?.includes("Nav Links"), "Should remove navigation");
    assert(!prepared?.includes("Sidebar Content"), "Should remove sidebar");
    assert(!prepared?.includes("Site Footer"), "Should remove footer");
    assert(!prepared?.includes("var ads = loadAds()"), "Should remove scripts");
  },
});

Deno.test({
  name: "prepareHtmlForAI ignores structured data but preserves content",
  fn() {
    const html = `
      <!DOCTYPE html><html><head><title>Manhattan Recipe</title>
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": "Manhattan Cocktail",
        "recipeIngredient": [
          "2 oz rye whiskey",
          "1 oz sweet vermouth",
          "2 dashes Angostura bitters"
        ],
        "recipeInstructions": "Stir with ice, strain into a chilled glass"
      }
      </script>
      </head>
      <body>
        <article>
          <h1>Manhattan</h1>
          <p>A classic whiskey cocktail.</p>
        </article>
      </body>
      </html>
    `;

    const prepared = prepareHtmlForAI(html, "https://example.com/manhattan");

    assert(prepared !== null, "Should return prepared HTML");
    assert(
      prepared?.includes("<title>Manhattan Recipe</title>"),
      "Should preserve page title",
    );
    assert(
      prepared?.includes("<h1>Manhattan</h1>"),
      "Should preserve main content",
    );
    assert(
      prepared?.includes("<p>A classic whiskey cocktail.</p>"),
      "Should preserve article content",
    );
    assert(
      !prepared?.includes("@type"),
      "Should remove structured data script",
    );
  },
});

Deno.test({
  name: "prepareHtmlForAI returns null for invalid HTML",
  fn() {
    const prepared = prepareHtmlForAI("");
    assertEquals(prepared, null);
  },
});

Deno.test({
  name:
    "prepareHtmlForAI falls back to body content when no recipe sections found",
  fn() {
    const html = `
      <!DOCTYPE html><html><head><title>Simple Page</title></head>
      <body>
        <div>
          <p>This is a simple page without recipe-specific markup.</p>
          <p>1 oz gin, 1 oz Campari, 1 oz sweet vermouth. Stir with ice and strain.</p>
        </div>
        <script>console.log('test');</script>
      </body>
      </html>
    `;

    const prepared = prepareHtmlForAI(html, "https://example.com/page");

    assert(prepared !== null, "Should return prepared HTML");
    assert(
      prepared?.includes("1 oz gin"),
      "Should preserve content even without recipe markup",
    );
    assert(!prepared?.includes("console.log"), "Should remove scripts");
  },
});

// Mock tests that would require real network requests
// These would need proper mocking in a real test environment
Deno.test({
  name: "fetchUrlContent correctly requests and processes a URL",
  ignore: true, // Skip this test since it requires network
  async fn() {
    const { html, contentType } = await fetchUrlContent(
      "https://example.com/",
    );
    assert(html.length > 0);
    assert(contentType.includes("text/html"));
  },
});

Deno.test({
  name: "prepareHtmlForAI handles large HTML content efficiently",
  fn() {
    // Generate large HTML content similar to liquor.com case
    const largeHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recipe Page</title>
        <style>${"body { margin: 0; } ".repeat(1000)}</style>
        <script>${"var analytics = {}; ".repeat(500)}</script>
      </head>
      <body>
        <header>${"Navigation Item ".repeat(100)}</header>
        <nav>${"<a href='/link'>Link</a>".repeat(50)}</nav>
        <aside class="sidebar">${"Ad content ".repeat(200)}</aside>
        <div class="comments">${"User comment ".repeat(300)}</div>
        <main>
          <article class="recipe">
            <h1>Cocktail Recipe</h1>
            <img src="https://example.com/cocktail.jpg" alt="Cocktail" 
                 class="recipe-image" style="width:100%" data-src="lazy.jpg" />
            <div class="ingredients">
              <p>1 oz ingredient one</p>
              <p>2 oz ingredient two</p>
            </div>
            <div class="instructions">
              <p>Mix and serve</p>
            </div>
          </article>
        </main>
        <footer>${"Footer content ".repeat(100)}</footer>
        ${"<!-- Comment padding -->".repeat(1000)}
      </body>
      </html>
    `;

    const prepared = prepareHtmlForAI(largeHTML, "https://example.com/recipe");

    assert(prepared !== null, "Should return prepared HTML");
    assert(
      prepared.length < largeHTML.length / 2,
      `Should significantly reduce size: ${prepared.length} < ${
        largeHTML.length / 2
      }`,
    );

    // Essential content preserved
    assert(
      prepared.includes("<h1>Cocktail Recipe</h1>"),
      "Should preserve recipe title",
    );
    assert(prepared.includes("1 oz ingredient"), "Should preserve ingredients");
    assert(prepared.includes("Mix and serve"), "Should preserve instructions");

    // Image preserved with essential attributes
    assert(
      prepared.includes('<img src="https://example.com/cocktail.jpg"'),
      "Should preserve image src",
    );
    assert(prepared.includes('alt="Cocktail"'), "Should preserve image alt");

    // Noise removed
    assert(
      !prepared.includes("Navigation Item"),
      "Should remove header content",
    );
    assert(!prepared.includes("Ad content"), "Should remove sidebar");
    assert(!prepared.includes("User comment"), "Should remove comments");
    assert(!prepared.includes("Footer content"), "Should remove footer");
    assert(!prepared.includes("<!-- Comment"), "Should remove HTML comments");
    assert(!prepared.includes("analytics"), "Should remove scripts");
    assert(!prepared.includes("body { margin"), "Should remove styles");
  },
});

Deno.test({
  name: "prepareHtmlForAI properly extracts YouTube recipe data",
  fn() {
    const youtubeHtml = `
      <html>
      <head><title>YouTube Recipe</title></head>
      <body>
        <script nonce="123456">
        var ytInitialPlayerResponse = {
          "microformat": {
            "playerMicroformatRenderer": {
              "title": {
                "simpleText": "Classic Pegu Club Cocktail Recipe"
              },
              "description": {
                "simpleText": "Recipe for Pegu Club Cocktail\\n• 70 ml Gin\\n• 15 ml fresh lime juice\\n• 15 ml Orange Liqueur\\n• 1 dash Angostura bitters\\n• 1 dash Orange bitters"
              },
              "ownerChannelName": "Cocktail Channel",
              "uploadDate": "2022-07-05"
            }
          }
        };
        </script>
        <div id="player">Video Player</div>
      </body>
      </html>
    `;

    const prepared = prepareHtmlForAI(
      youtubeHtml,
      "https://www.youtube.com/watch?v=123456",
    );

    assert(prepared !== null, "Should return prepared HTML");
    assert(
      prepared?.includes("Classic Pegu Club Cocktail Recipe"),
      "Should extract video title",
    );
    assert(
      prepared?.includes("70 ml Gin"),
      "Should extract recipe ingredients from description",
    );
    assert(
      prepared?.includes("Cocktail Channel"),
      "Should extract channel name",
    );
  },
});
