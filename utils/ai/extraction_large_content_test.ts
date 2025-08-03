import { assert } from "@std/assert";
import { prepareHtmlForAI } from "../url-content.ts";

// Mock large HTML content that simulates the Paper Plane case
function generateLargeHTML(sizeInKB: number): string {
  const baseContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Paper Plane Cocktail Recipe</title>
      <style>.lots { of: css; rules: here; }</style>
    </head>
    <body>
      <header>Site Header with lots of navigation</header>
      <nav>Many nav links here</nav>
      <aside>Sidebar with ads and related content</aside>
      <main>
        <article class="recipe-content">
          <h1>Paper Plane</h1>
          <img src="https://example.com/paper-plane.jpg" alt="Paper Plane cocktail">
          <p>The Paper Plane is a modern classic cocktail.</p>
          <div class="ingredients">
            <h2>Ingredients</h2>
            <ul>
              <li>3/4 oz bourbon</li>
              <li>3/4 oz Aperol</li>
              <li>3/4 oz Amaro Nonino</li>
              <li>3/4 oz lemon juice</li>
            </ul>
          </div>
          <div class="instructions">
            <h2>Instructions</h2>
            <ol>
              <li>Add all ingredients to a shaker with ice</li>
              <li>Shake until well-chilled</li>
              <li>Strain into a coupe glass</li>
            </ol>
          </div>
        </article>
  `;

  // Add padding content to reach desired size
  const paddingSize = sizeInKB * 1024 - baseContent.length - 100;
  const padding = "<!-- padding content -->" +
    "x".repeat(Math.max(0, paddingSize));

  return baseContent + padding + `
      </main>
      <footer>Site footer</footer>
    </body>
    </html>
  `;
}

Deno.test({
  name:
    "prepareHtmlForAI reduces large content while preserving recipe and images",
  fn() {
    const largeHTML = generateLargeHTML(200); // 200KB HTML
    const processed = prepareHtmlForAI(largeHTML, "https://example.com/recipe");

    assert(processed !== null, "Should return processed HTML");
    assert(processed.length < largeHTML.length, "Should reduce content size");

    // Check that recipe content is preserved
    assert(processed.includes("Paper Plane"), "Should preserve recipe title");
    assert(processed.includes("3/4 oz bourbon"), "Should preserve ingredients");
    assert(
      processed.includes("Shake until well-chilled"),
      "Should preserve instructions",
    );

    // Check that image is preserved
    assert(
      processed.includes('<img src="https://example.com/paper-plane.jpg"'),
      "Should preserve image with src attribute",
    );
    assert(
      processed.includes('alt="Paper Plane cocktail"'),
      "Should preserve alt attribute",
    );

    // Check that noise is removed
    assert(!processed.includes("Site Header"), "Should remove header");
    assert(!processed.includes("Many nav links"), "Should remove navigation");
    assert(!processed.includes("Sidebar with ads"), "Should remove sidebar");
    assert(!processed.includes("Site footer"), "Should remove footer");
  },
});

Deno.test({
  name: "HTML attribute stripping preserves essential attributes only",
  fn() {
    const htmlWithManyAttrs = `
      <div class="recipe-card" id="main-recipe" style="color: red;" data-track="123">
        <img src="cocktail.jpg" alt="Cocktail" class="hero-image" style="width:100%" data-lazy="true" />
        <a href="/recipes/more" class="link" target="_blank" rel="noopener">More recipes</a>
        <p class="description" style="font-size: 14px;">Recipe description</p>
      </div>
    `;

    const processed = prepareHtmlForAI(htmlWithManyAttrs);

    assert(processed !== null);

    // Should preserve essential attributes
    assert(processed.includes('src="cocktail.jpg"'), "Should keep img src");
    assert(processed.includes('alt="Cocktail"'), "Should keep img alt");
    assert(processed.includes('href="/recipes/more"'), "Should keep link href");

    // Should remove non-essential attributes
    assert(!processed.includes("style="), "Should remove style attributes");
    assert(!processed.includes("data-track="), "Should remove data attributes");
    assert(!processed.includes("data-lazy="), "Should remove data attributes");
    assert(!processed.includes('class="recipe-card"'), "Should remove classes");
    assert(!processed.includes('id="main-recipe"'), "Should remove IDs");
  },
});
