import { HttpError } from "fresh";
import RecipeImage from "../../islands/RecipeImage.tsx";
import { define } from "../../utils.ts";
import { recipeModel } from "../../utils/db/recipe-model.ts";
import { checkAdminFromUser } from "../../utils/auth/admin.ts";

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
  ({ data: recipe, state }) => {
    const isAdmin = checkAdminFromUser(state.user);
    return (
      <div class="container mx-auto p-3 md:p-4 pb-8 md:pb-12">
        {/* Hero Image Section with Gradient Background */}
        <div class="mb-6">
          <div class="flex justify-center items-center md:py-5">
            <RecipeImage
              recipe={recipe}
              className="w-full max-h-[250px] md:max-h-[300px]"
              imageClassName="w-full max-h-[250px] md:max-h-[300px] object-contain relative rounded-lg"
              gradientOpacity={0.2}
              isAdmin={isAdmin}
            />
          </div>
        </div>

        {/* Recipe Name and Tags - In a card-like section */}
        <div class="max-w-4xl mx-auto text-center mb-6 md:mb-8">
          <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
            {recipe.name}
          </h1>
          <div class="flex flex-wrap gap-2 justify-center mb-2">
            {recipe.tags.map((tag) => (
              <span key={tag} class="badge badge-primary">{tag}</span>
            ))}
          </div>
          {/* No strength or sweetness ratings displayed */}
        </div>

        {/* Recipe Content Section */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {/* Ingredients */}
          <div class="card bg-base-100">
            <div class="card-body">
              <h2 class="card-title text-2xl mb-4">
                Ingredients
              </h2>
              <ul class="space-y-3">
                {recipe.ingredients.map((ingredient) => (
                  <li
                    key={ingredient.ingredientId}
                    class="flex items-start gap-3 hover:bg-base-200 p-3 rounded-md transition-colors"
                  >
                    <div class="text-left font-bold text-primary w-20 min-w-20 shrink-0 pt-1">
                      {ingredient.quantity} {ingredient.unit}
                    </div>
                    <div class="flex-1">
                      <div class="flex flex-wrap items-center">
                        <span class="font-semibold text-lg">
                          {ingredient.name}
                        </span>
                        {ingredient.optional && (
                          <span class="text-sm text-gray-500 ml-2">
                            (optional)
                          </span>
                        )}
                      </div>
                      {ingredient.notes && (
                        <span class="text-sm text-gray-600 block mt-1">
                          {ingredient.notes}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {recipe.garnish.length > 0 && (
                <div class="mt-6">
                  <h3 class="text-xl font-semibold mb-2">
                    Garnish
                  </h3>
                  <ul class="list-disc list-inside space-y-2">
                    {recipe.garnish.map((item) => (
                      <li key={item} class="text-lg">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Glassware */}
              <div class="mt-6">
                <h3 class="text-xl font-semibold mb-2">
                  Glassware
                </h3>
                <p class="capitalize text-lg">{recipe.glassware}</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div class="card bg-base-100">
            <div class="card-body">
              <h2 class="card-title text-2xl mb-4">
                Instructions
              </h2>
              <ul class="steps steps-vertical">
                {recipe.preparation.map((step, index) => (
                  <li key={index} class="step step-primary">
                    <div class="text-left ml-4 my-1">{step}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Additional Information Section with standard divider */}
        <div class="mt-12">
          {/* Standard DaisyUI divider */}
          <div class="divider max-w-4xl mx-auto">Additional Information</div>

          <div class="max-w-4xl mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Reorder for mobile: About section first */}
              <div class="order-2 md:order-2 md:col-span-2">
                {/* About this Recipe - Takes more space if present */}
                {recipe.description && (
                  <div class="card bg-base-100 mb-6 md:mb-0">
                    <div class="card-body">
                      <div class="flex items-center mb-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5 mr-2 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <h2 class="card-title text-2xl">About this Cocktail</h2>
                      </div>
                      <p class="text-lg">{recipe.description}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Source information - Always visible, now ordered after description on mobile */}
              <div class="order-3 md:order-1 md:col-span-1">
                <div class="card bg-base-100 h-min">
                  <div class="card-body">
                    <div class="flex items-center mb-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 mr-2 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      <h3 class="card-title text-xl">Source</h3>
                    </div>
                    <p class="text-lg">
                      {recipe.source.name}
                    </p>
                    {recipe.source.url && (
                      <div class="card-actions mt-2">
                        <a
                          href={recipe.source.url}
                          class="btn btn-sm btn-outline btn-primary"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Original
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
