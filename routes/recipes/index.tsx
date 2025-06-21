import { define } from "../../utils.ts";
import { recipeModel } from "../../utils/db/recipe-model.ts";

export const handler = define.handlers({
  async GET(ctx) {
    ctx.state.title = "Recipes";
    const recipes = await recipeModel.listAll(30, 0);
    return { data: recipes };
  },
});

export default define.page<typeof handler>(
  ({ data: recipes }) => {
    return (
      <div class="container mx-auto p-4">
        <h1 class="text-4xl font-bold mb-6">Cocktail Recipes</h1>

        <div class="flex mb-6">
          <input
            type="text"
            placeholder="Search recipes..."
            class="input input-bordered w-full max-w-xs mr-2"
          />
          <div class="dropdown">
            <div tabIndex={0} role="button" class="btn">
              Filter
            </div>
            <ul
              tabIndex={0}
              class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <a>All Recipes</a>
              </li>
              <li>
                <a>Whiskey</a>
              </li>
              <li>
                <a>Gin</a>
              </li>
            </ul>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <a
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              class="card bg-base-100 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer block"
              tabIndex={0}
            >
              <figure>
                {recipe.images?.vector?.url
                  ? (
                    <img
                      src={recipe.images.vector.url}
                      alt={recipe.name}
                      class="h-48 w-full object-contain bg-base-300"
                    />
                  )
                  : recipe.images?.raster?.url
                  ? (
                    <img
                      src={recipe.images.raster.url}
                      alt={recipe.name}
                      class="h-48 w-full object-contain bg-base-300"
                    />
                  )
                  : (
                    <div class="bg-base-300 h-48 w-full flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
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
