import { useSignal } from "@preact/signals";
import type { Recipe } from "../types/recipe.ts";
import type { User } from "../types/user.ts";

interface RecipeFavoritesProps {
  recipe: Recipe;
  user: User;
  className?: string;
}

interface AddToRecipesState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export default function RecipeFavorites({
  recipe,
  user,
  className = "",
}: RecipeFavoritesProps) {
  // Component state
  const state = useSignal<AddToRecipesState>({
    loading: false,
    error: null,
    success: false,
  });

  // Don't show favorites button if:
  // - User owns the recipe (they already have it)
  // - Recipe is private
  // - User is not authenticated (handled by parent, but safety check)
  if (!user || recipe.createdBy === user.id || recipe.visibility !== "public") {
    return null;
  }

  const addToRecipes = async () => {
    // Prevent double-clicks
    if (state.value.loading) return;

    state.value = {
      ...state.value,
      loading: true,
      error: null,
    };

    try {
      const response = await fetch(`/api/recipes/${recipe.id}/favorite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const result = await response.json();

      // Update state to show success
      state.value = {
        loading: false,
        error: null,
        success: true,
      };

      // Optional: Show success feedback (could be a toast notification)
      console.log(result.message);
    } catch (error) {
      console.error("Failed to add recipe:", error);

      state.value = {
        ...state.value,
        loading: false,
        error: error instanceof Error
          ? error.message
          : "Failed to update recipe collection",
      };
    }
  };

  return (
    <div class={`recipe-favorites ${className}`}>
      <button
        type="button"
        onClick={addToRecipes}
        disabled={state.value.loading || state.value.success}
        title="Add to my recipes"
        class={`
          btn btn-square
          transition-all duration-200 ease-in-out
          hover:scale-110 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
          ${
          state.value.success
            ? "text-success"
            : "text-base-content/60 hover:text-primary"
        }
          ${state.value.loading ? "loading" : ""}
        `}
        data-success={state.value.success ? "true" : "false"}
        aria-label="Add to my recipes"
      >
        {state.value.loading
          ? (
            // Loading spinner
            <span class="loading loading-spinner loading-sm"></span>
          )
          : (
            // Plus icon for adding to recipes
            state.value.success
              ? (
                // Checkmark for success
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="size-[1.2em]"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )
              : (
                // Plus icon
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
                    d="M12 4v16m8-8H4"
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
