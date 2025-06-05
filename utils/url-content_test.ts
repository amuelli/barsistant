import { assert } from "@std/assert";
import {
  extractTextFromHtml,
  fetchUrlContent,
  prepareHtmlForAI,
} from "./url-content.ts";

Deno.test({
  name: "fetchUrlContent fetches HTML and content type",
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

    const prepared = prepareHtmlForAI(html);

    assert(prepared !== null, "Should return prepared HTML");
    assert(
      prepared?.includes("<title>Negroni Recipe</title>"),
      "Should preserve page title",
    );
    assert(
      prepared?.includes("<h1>Classic Negroni</h1>"),
      "Should preserve main heading",
    );
    assert(
      prepared?.includes("1 oz gin"),
      "Should preserve ingredient content",
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
  name: "prepareHtmlForAI extracts structured data when available",
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

    const prepared = prepareHtmlForAI(html);

    assert(prepared !== null, "Should return prepared HTML");
    assert(
      prepared?.includes("<structured-data>"),
      "Should extract structured data",
    );
    assert(
      prepared?.includes("Manhattan Cocktail"),
      "Should include structured recipe name",
    );
    assert(
      prepared?.includes("2 oz rye whiskey"),
      "Should include structured ingredients",
    );
  },
});

Deno.test({
  name: "prepareHtmlForAI returns null for invalid HTML",
  fn() {
    const prepared = prepareHtmlForAI("");
    assert(prepared === null, "Should return null for empty input");
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

    const prepared = prepareHtmlForAI(html);

    assert(prepared !== null, "Should return prepared HTML");
    assert(
      prepared?.includes("1 oz gin"),
      "Should preserve content even without recipe markup",
    );
    assert(!prepared?.includes("console.log"), "Should remove scripts");
  },
});
