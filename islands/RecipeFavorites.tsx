import { useSignal } from "@preact/signals";
import type { Recipe } from "../types/recipe.ts";
import type { User } from "../types/user.ts";

interface RecipeFavoritesProps {
  recipe: Recipe;
  user: User;
  initialInCollection: boolean;
  className?: string;
}

interface FavoritesState {
  inCollection: boolean;
  loading: boolean;
  error: string | null;
}

export default function RecipeFavorites({
  recipe,
  user,
  initialInCollection,
  className = "",
}: RecipeFavoritesProps) {
  // Component state
  const state = useSignal<FavoritesState>({
    inCollection: initialInCollection,
    loading: false,
    error: null,
  });

  // Don't show favorites button if:
  // - User owns the recipe (they already have it)
  // - Recipe is private
  // - User is not authenticated (handled by parent, but safety check)
  if (!user || recipe.createdBy === user.id || recipe.visibility !== "public") {
    return null;
  }

  const toggleFavorite = async () => {
    // Prevent double-clicks
    if (state.value.loading) return;

    state.value = {
      ...state.value,
      loading: true,
      error: null,
    };

    try {
      const response = await fetch(`/api/recipes/${recipe.id}/collection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "toggle",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const result = await response.json();

      // Update state based on API response
      state.value = {
        inCollection: result.inCollection,
        loading: false,
        error: null,
      };

      // Optional: Show success feedback (could be a toast notification)
      console.log(result.message);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);

      state.value = {
        ...state.value,
        loading: false,
        error: error instanceof Error
          ? error.message
          : "Failed to update favorites",
      };
    }
  };

  return (
    <div class={`recipe-favorites ${className}`}>
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={state.value.loading}
        title={state.value.inCollection
          ? "Remove from favorites"
          : "Add to favorites"}
        class={`
          btn btn-square
          transition-all duration-200 ease-in-out
          hover:scale-110 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
          ${
          state.value.inCollection
            ? "text-error hover:text-error/80"
            : "text-base-content/60 hover:text-error"
        }
          ${state.value.loading ? "loading" : ""}
        `}
        data-in-collection={state.value.inCollection ? "true" : "false"}
        aria-label={state.value.inCollection
          ? "Remove from favorites"
          : "Add to favorites"}
      >
        {state.value.loading
          ? (
            // Loading spinner
            <span class="loading loading-spinner loading-sm"></span>
          )
          : (
            // Heart SVG rendered directly in JSX
            state.value.inCollection
              ? (
                // Filled heart (in collection)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="size-[1.2em]"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              )
              : (
                // Outlined heart (not in collection)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  class="size-[1.2em]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              )
          )}
      </button>

      {/* Error message */}
      {state.value.error && (
        <div
          class="tooltip tooltip-error tooltip-bottom"
          data-tip={state.value.error}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4 text-error ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.892-.833-2.664 0L4.168 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
