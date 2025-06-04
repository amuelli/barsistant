import { page } from "fresh";
import { define } from "../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    ctx.state.title = "Recipes";

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
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">Paste a link to a recipe</span>
            </label>
            <input
              type="text"
              placeholder="https://example.com/cocktail-recipe"
              class="input input-bordered w-full"
            />
          </div>

          <div class="form-control mt-4">
            <button type="button" class="btn btn-primary">
              Extract Recipe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
