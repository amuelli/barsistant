import { HttpError } from "fresh";
import RecipeImage from "../../islands/RecipeImage.tsx";
import { define } from "../../utils.ts";
import { recipeModel } from "../../utils/db/recipe-model.ts";

export const handler = define.handlers({
  async GET(ctx) {
    // Use getById instead of getWithFullIngredients; all display data is now in the recipe
    const recipe = await recipeModel.getById(ctx.params.id);
    if (!recipe) {
      throw new HttpError(404, "Recipe not found");
    }
    ctx.state.title = recipe.name;
    return { data: recipe };
  },
});

export default define.page<typeof handler>(
  ({ data: recipe }) => {
    return (
      <div class="container mx-auto p-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recipe Header */}
          <div>
            <h1 class="text-4xl font-bold mb-4">{recipe.name}</h1>
            <p class="text-lg mb-6">{recipe.description}</p>
            <div class="flex flex-wrap gap-2 mb-6">
              {recipe.tags.map((tag) => (
                <span key={tag} class="badge badge-primary">{tag}</span>
              ))}
            </div>
            <div class="stats shadow mb-6">
              <div class="stat">
                <div class="stat-title">Strength</div>
                <div class="stat-value text-2xl">🥃 {recipe.strength}/10</div>
              </div>
              <div class="stat">
                <div class="stat-title">Sweetness</div>
                <div class="stat-value text-2xl">🍯 {recipe.sweetness}/10</div>
              </div>
            </div>
          </div>

          {/* Recipe Image */}
          <div class="lg:order-first">
            <RecipeImage recipe={recipe} />
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Ingredients */}
          <div>
            <h2 class="text-2xl font-bold mb-4">Ingredients</h2>
            <ul class="space-y-2">
              {recipe.ingredients.map((ingredient) => (
                <li
                  key={ingredient.ingredientId}
                  class="flex items-center gap-2"
                >
                  <div class="flex-1">
                    <span class="font-medium">{ingredient.name}</span>
                    {ingredient.optional && (
                      <span class="text-sm text-gray-500 ml-2">(optional)</span>
                    )}
                  </div>
                  <div class="text-right">
                    {ingredient.quantity} {ingredient.unit}
                  </div>
                </li>
              ))}
            </ul>

            {recipe.garnish.length > 0 && (
              <>
                <h3 class="text-xl font-bold mt-6 mb-2">Garnish</h3>
                <ul class="list-disc list-inside">
                  {recipe.garnish.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </>
            )}
          </div>

          {/* Instructions */}
          <div>
            <h2 class="text-2xl font-bold mb-4">Instructions</h2>
            <ul class="steps steps-vertical">
              {recipe.preparation.map((step, index) => (
                <li key={index} class="step step-primary">
                  <div class="text-left ml-4">{step}</div>
                </li>
              ))}
            </ul>

            {/* Glassware */}
            <div class="mt-6">
              <h3 class="text-xl font-bold mb-2">Glassware</h3>
              <p>{recipe.glassware}</p>
            </div>

            {/* Source */}
            <div class="mt-6">
              <h3 class="text-xl font-bold mb-2">Source</h3>
              <p>
                {recipe.source.name}
                {recipe.source.url && (
                  <a
                    href={recipe.source.url}
                    class="link link-primary ml-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Original
                  </a>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
