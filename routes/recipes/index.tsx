import { define } from "../../utils.ts";
import { recipeModel } from "../../utils/recipe-model.ts";

export const handler = define.handlers({
  async GET(ctx) {
    ctx.state.title = "Recipes";
    const recipes = await recipeModel.listAll(20, 0);
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
            <div key={recipe.id} class="card bg-base-100 shadow-xl">
              <figure>
                {recipe.image
                  ? (
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      class="h-48 w-full object-cover"
                    />
                  )
                  : <div class="bg-gray-300 h-48 w-full"></div>}
              </figure>
              <div class="card-body">
                <h2 class="card-title">{recipe.name}</h2>
                <p class="line-clamp-2">{recipe.description}</p>
                <div class="flex gap-2 my-2">
                  {recipe.tags.slice(0, 3).map((tag) => (
                    <span key={tag} class="badge badge-primary">{tag}</span>
                  ))}
                </div>
                <div class="card-actions justify-between items-center">
                  <div class="flex items-center gap-2">
                    <div class="tooltip" data-tip="Strength">
                      <span class="text-sm">🥃 {recipe.strength}/10</span>
                    </div>
                    <div class="tooltip" data-tip="Sweetness">
                      <span class="text-sm">🍯 {recipe.sweetness}/10</span>
                    </div>
                  </div>
                  <a href={`/recipes/${recipe.id}`} class="btn btn-primary">
                    View Recipe
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);
