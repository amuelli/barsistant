import RecipeImage from "../islands/RecipeImage.tsx";
import { define } from "../utils.ts";
import { recipeModel } from "../utils/db/recipe-model.ts";

export const handler = define.handlers({
  async GET(ctx) {
    ctx.state.title = "Latest Public Recipes";
    const user = ctx.state.user; // From auth middleware

    // Always show public recipes on the home page
    const recipes = await recipeModel.getPublicRecipes(12);

    return { data: { recipes, user } };
  },
});

export default define.page<typeof handler>(
  ({ data }) => {
    const { recipes, user } = data;

    return (
      <div class="container mx-auto p-4">
        {/* Hero section - smaller than before */}
        <div class="hero py-16 bg-base-100">
          <div class="hero-content text-center">
            <div class="max-w-md">
              <div class="flex justify-center">
                <img
                  class="w-16 h-16 mb-4"
                  src="/logo.svg"
                  alt="Barsistant logo"
                />
              </div>
              <h1 class="text-4xl font-bold text-primary">Barsistant</h1>
              <p class="py-4">
                Your smart cocktail recipe assistant with AI-powered recipe
                extraction capabilities.
              </p>
              <div class="flex gap-4 justify-center">
                <a
                  href={user ? "/recipes" : "/auth/login"}
                  class="btn btn-primary"
                >
                  {user ? "My Recipes" : "Get Started"}
                </a>
                <a href="/extract" class="btn btn-secondary">
                  Add Recipe
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Public Recipes */}
        <div class="mb-8">
          <h2 class="text-3xl font-bold mb-6">Latest Public Recipes</h2>
          <p class="text-base-content/70 mb-6">
            Discover cocktail recipes shared by the community
          </p>
          {recipes.length > 0
            ? (
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recipes.map((recipe) => (
                  <a
                    key={recipe.id}
                    href={`/recipes/${recipe.id}`}
                    class="card bg-base-100 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer block"
                    tabIndex={0}
                  >
                    <figure>
                      <div class="w-full">
                        <RecipeImage
                          recipe={recipe}
                          className="w-full h-48"
                          imageClassName="w-full h-48 object-contain relative"
                          maxHeight="192px"
                          showRegenerateButton={false}
                          gradientOpacity={0.15}
                        />
                      </div>
                    </figure>
                    <div class="card-body">
                      <h3 class="card-title text-base">{recipe.name}</h3>
                      <p class="line-clamp-2 text-sm">{recipe.description}</p>
                      <div class="flex flex-wrap gap-1 my-2 min-h-[2rem]">
                        {recipe.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            class="badge badge-primary badge-sm max-w-[8rem] truncate"
                            title={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )
            : (
              <div class="text-center py-12">
                <p class="text-base-content/60 mb-4">
                  No public recipes available yet.
                </p>
                <a href="/extract" class="btn btn-primary">
                  Create the First Recipe
                </a>
              </div>
            )}
        </div>

        {/* Browse all recipes link */}
        <div class="text-center">
          <a href="/recipes" class="btn btn-outline">
            {user ? "View My Collection" : "Browse All Recipes"}
          </a>
        </div>
      </div>
    );
  },
);
