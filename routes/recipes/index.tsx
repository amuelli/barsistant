import RecipeImage from "🏝️/RecipeImage.tsx";
import { define } from "../../utils.ts";
import { recipeModel } from "🛠️/db/recipe-model.ts";
import { userCollectionModel } from "🛠️/db/user-collection-model.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const user = ctx.state.user; // From auth middleware
    ctx.state.title = user ? "My Recipes" : "Recipes";
    const url = ctx.url;
    const query = url.searchParams.get("query") || "";

    let recipes;
    if (query) {
      // For search, use secure search methods based on user authentication
      if (user) {
        // Authenticated users can search their accessible recipes (public + own private)
        recipes = await recipeModel.searchUserAccessibleRecipes(user.id, {
          query,
          limit: 100,
        });
      } else {
        // Unauthenticated users only see public recipes in search
        recipes = await recipeModel.searchPublicRecipes({ query, limit: 100 });
      }
    } else {
      if (user) {
        // Authenticated: Show user's collection (owned + saved recipes)
        recipes = await userCollectionModel.getUserCollection(user.id, 30);
      } else {
        // Unauthenticated: Show only public recipes
        recipes = await recipeModel.listPublicRecipes(30);
      }
    }

    return { data: { recipes, query, user } };
  },
});

export default define.page<typeof handler>(
  ({ data }) => {
    const { recipes, query, user } = data;
    const pageTitle = user ? "My Recipe Collection" : "Public Recipes";

    return (
      <div class="container mx-auto p-4">
        <h1 class="text-4xl font-bold mb-6">{pageTitle}</h1>
        {user && (
          <p class="text-base-content/70 mb-4">
            Your personal collection of created and saved recipes
          </p>
        )}
        <form method="GET" class="flex mb-6">
          <input
            type="text"
            name="query"
            placeholder="Search recipes..."
            class="input input-bordered w-full max-w-xs mr-2"
            value={query}
            aria-label="Search recipes"
          />
          <button type="submit" class="btn">Search</button>
        </form>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <h2 class="card-title">{recipe.name}</h2>
                <p class="line-clamp-2">{recipe.description}</p>
                <div class="flex flex-wrap gap-2 my-2 min-h-[2.5rem]">
                  {recipe.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      class="badge badge-primary max-w-[12rem] truncate"
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
      </div>
    );
  },
);
