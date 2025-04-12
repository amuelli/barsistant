export default function RecipesPage() {
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
        {/* Single placeholder recipe card */}
        <div class="card bg-base-100 shadow-xl">
          <figure>
            <div class="bg-gray-300 h-48 w-full"></div>
          </figure>
          <div class="card-body">
            <h2 class="card-title">Placeholder Recipe</h2>
            <p>This is a placeholder for a recipe card.</p>
            <div class="card-actions justify-end">
              <button type="button" class="btn btn-primary">
                View Recipe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
