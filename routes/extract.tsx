import { page } from "fresh";
import RecipeExtractor from "../islands/RecipeExtractor.tsx";
import { define } from "../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    ctx.state.title = "Extract Recipe";

    return page();
  },
});

export default function ExtractRecipePage() {
  return (
    <div class="container mx-auto p-4">
      <h1 class="text-4xl font-bold mb-6">Extract Recipe</h1>
      <p class="mb-6">
        Add recipes from external sources by pasting the URL below. We'll use AI
        to extract the recipe details.
      </p>

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <RecipeExtractor />
        </div>
      </div>
    </div>
  );
}
