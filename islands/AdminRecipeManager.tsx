import { useEffect, useState } from "preact/hooks";

interface Recipe {
  id: string;
  name: string;
  description?: string;
  source?: {
    name?: string;
    url?: string;
  };
  tags: string[];
  createdAt: string;
}

interface RecipeListResponse {
  recipes: Recipe[];
  hasMore: boolean;
  cursor: string;
  total: number;
}

export default function AdminRecipeManager() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCursor, setCurrentCursor] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedRecipeName, setSelectedRecipeName] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadRecipes = async (cursor = "", search = "") => {
    try {
      setLoading(true);
      setError(null);

      const url = new URL("/api/admin/recipes", globalThis.location.origin);
      if (cursor) url.searchParams.set("cursor", cursor);
      if (search.trim()) url.searchParams.set("search", search.trim());

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to load recipes");
      }

      const data: RecipeListResponse = await response.json();
      setRecipes(data.recipes);
      setCurrentCursor(data.cursor);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const handleSearch = () => {
    loadRecipes("", searchTerm);
  };

  const handleRefresh = () => {
    setSearchTerm("");
    loadRecipes();
  };

  const handleNextPage = () => {
    if (hasMore && currentCursor) {
      loadRecipes(currentCursor, searchTerm);
    }
  };

  const handlePreviousPage = () => {
    loadRecipes("", searchTerm);
  };

  const handleDeleteClick = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id);
    setSelectedRecipeName(recipe.name);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRecipeId) return;

    try {
      const response = await fetch(`/api/admin/recipes/${selectedRecipeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete recipe");
      }

      setShowDeleteModal(false);
      setSelectedRecipeId(null);
      setSelectedRecipeName("");

      // Refresh the recipe list
      loadRecipes("", searchTerm);

      // Show success message
      alert("Recipe deleted successfully");
    } catch (err) {
      alert(
        `Failed to delete recipe: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading && recipes.length === 0) {
    return (
      <div class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div class="text-center py-8">
        <div class="text-error mb-4">{error}</div>
        <button
          type="button"
          onClick={handleRefresh}
          class="btn btn-outline btn-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Controls */}
      <div class="card bg-base-200 shadow-lg mb-6">
        <div class="card-body">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="form-control flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm((e.target as HTMLInputElement).value)}
                onKeyPress={handleKeyPress}
                placeholder="Search recipes by name or description..."
                class="input input-bordered w-full"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              class="btn btn-primary"
            >
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Search
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              class="btn btn-outline"
            >
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Recipe List */}
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <div class="flex justify-between items-center mb-4">
            <h2 class="card-title">Recipes</h2>
            <div class="text-sm text-base-content/70">
              {recipes.length} recipes
            </div>
          </div>

          {recipes.length === 0
            ? (
              <div class="text-center py-12">
                <svg
                  class="w-16 h-16 mx-auto text-base-content/30 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <p class="text-base-content/50 text-lg">No recipes found</p>
              </div>
            )
            : (
              <>
                <div class="overflow-x-auto">
                  <table class="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Source</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipes.map((recipe) => (
                        <tr key={recipe.id}>
                          <td>
                            <div class="font-semibold">{recipe.name}</div>
                            {recipe.description && (
                              <div class="text-sm text-base-content/70 truncate max-w-xs">
                                {truncateText(recipe.description, 100)}
                              </div>
                            )}
                          </td>
                          <td>
                            <div class="text-sm">
                              {recipe.source?.name || "Unknown"}
                            </div>
                            {recipe.source?.url && (
                              <div class="text-xs text-base-content/50 truncate max-w-xs">
                                {truncateText(recipe.source.url, 50)}
                              </div>
                            )}
                          </td>
                          <td>
                            <div class="text-sm">
                              {formatDate(recipe.createdAt)}
                            </div>
                          </td>
                          <td>
                            <div class="flex gap-2">
                              <a
                                href={`/recipes/${recipe.id}`}
                                class="btn btn-ghost btn-xs"
                                target="_blank"
                              >
                                View
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(recipe)}
                                class="btn btn-error btn-xs"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div class="flex justify-between items-center mt-4">
                  <button
                    type="button"
                    onClick={handlePreviousPage}
                    class="btn btn-outline btn-sm"
                    disabled={!currentCursor}
                  >
                    Previous
                  </button>
                  <span class="text-sm text-base-content/70">
                    {/* Showing X recipes */}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextPage}
                    class="btn btn-outline btn-sm"
                    disabled={!hasMore}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg text-error">
              Delete "{selectedRecipeName}"
            </h3>
            <p class="py-4">
              Are you sure you want to delete this recipe? This action cannot be
              undone. All user favorites and notes for this recipe will also be
              deleted.
            </p>
            <div class="modal-action">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                class="btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                class="btn btn-error"
              >
                Delete Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
