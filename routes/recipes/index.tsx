import RecipeImage from "../../islands/RecipeImage.tsx";
import { define } from "../../utils.ts";
import { recipeModel } from "../../utils/db/recipe-model.ts";

export const handler = define.handlers({
  async GET(ctx) {
    ctx.state.title = "Recipes";
    const url = ctx.url;
    const query = url.searchParams.get("query") || "";
    let recipes;
    if (query) {
      recipes = await recipeModel.search({ query, limit: 100 });
    } else {
      recipes = await recipeModel.listAll(30);
    }
    return { data: { recipes, query } };
  },
});

export default define.page<typeof handler>(
  ({ data }) => {
    const { recipes, query } = data;
    return (
      <div class="container mx-auto p-4">
        <h1 class="text-4xl font-bold mb-6">Cocktail Recipes</h1>
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
