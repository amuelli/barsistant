import { HttpError } from "fresh";
import RecipeImage from "🏝️/RecipeImage.tsx";
import RecipeFavorites from "🏝️/RecipeFavorites.tsx";
import RecipePrivacyToggle from "🏝️/RecipePrivacyToggle.tsx";
import { define } from "../../utils.ts";
import { recipeModel } from "🛠️/db/recipe-model.ts";
import { userCollectionModel } from "🛠️/db/user-collection-model.ts";
import { checkAdminFromUser } from "🛠️/auth/admin.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const user = ctx.state.user;
    const recipe = await recipeModel.getById(ctx.params.id, user?.id);
    if (!recipe) {
      throw new HttpError(404, "Recipe not found");
    }

    // Check if user can access this recipe
    const canAccess = await recipeModel.canUserAccessRecipe(
      ctx.params.id,
      user?.id || null,
    );

    if (!canAccess) {
      throw new HttpError(403, "This recipe is private");
    }

    // Check if user has this recipe in their collection
    const inCollection = user
      ? await userCollectionModel.isInUserCollection(user.id, recipe.id)
      : false;

    // Check if user is the owner
    const isOwner = user && recipe.createdBy === user.id;

    ctx.state.title = recipe.name;
    return { data: { recipe, inCollection, isOwner, user } };
  },
});

export default define.page<typeof handler>(
  ({ data, state }) => {
    const { recipe, inCollection, isOwner, user } = data;
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
          <div class="flex items-center justify-center gap-3 mb-3">
            <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold">
              {recipe.name}
            </h1>

            {/* Privacy indicator - static for non-owners, interactive for owners */}
            {isOwner && user
              ? (
                <RecipePrivacyToggle
                  recipe={recipe}
                  user={user}
                  isOwner={isOwner}
                />
              )
              : (
                recipe.visibility === "private" && (
                  <div class="tooltip" data-tip="Private recipe">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-6 w-6 text-warning"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                )
              )}

            {/* Collection status (read-only indicator for owners) */}
            {user && inCollection && recipe.createdBy === user.id && (
              <div class="tooltip" data-tip="Your recipe">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-error"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            )}

            {/* Interactive favorites button for public recipes */}
            {user && (
              <RecipeFavorites
                recipe={recipe}
                user={user}
                initialInCollection={inCollection}
              />
            )}
          </div>
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
