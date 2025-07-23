import { useSignal } from "@preact/signals";
import type { Recipe } from "../types/recipe.ts";
import type { User } from "../types/user.ts";

interface RecipePrivacyToggleProps {
  recipe: Recipe;
  user: User;
  isOwner: boolean;
  className?: string;
}

interface PrivacyState {
  visibility: "public" | "private";
  loading: boolean;
  error: string | null;
  showConfirmDialog: boolean;
}

export default function RecipePrivacyToggle({
  recipe,
  user,
  isOwner,
  className = "",
}: RecipePrivacyToggleProps) {
  // Component state
  const state = useSignal<PrivacyState>({
    visibility: recipe.visibility || "private",
    loading: false,
    error: null,
    showConfirmDialog: false,
  });

  // Don't show toggle if:
  // - User is not authenticated
  // - User doesn't own the recipe
  if (!user || !isOwner) {
    return null;
  }

  const handleToggleClick = () => {
    // If making a public recipe private, show confirmation dialog
    if (state.value.visibility === "public") {
      state.value = {
        ...state.value,
        showConfirmDialog: true,
        error: null,
      };
    } else {
      // Making private recipe public - no confirmation needed
      toggleVisibility();
    }
  };

  const toggleVisibility = async () => {
    // Prevent double-clicks
    if (state.value.loading) return;

    // Hide dialog if it was shown
    state.value = {
      ...state.value,
      loading: true,
      error: null,
      showConfirmDialog: false,
    };

    try {
      const response = await fetch(`/api/recipes/${recipe.id}/visibility`, {
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
        visibility: result.visibility,
        loading: false,
        error: null,
        showConfirmDialog: false,
      };

      // Optional: Show success feedback (could be a toast notification)
      console.log(result.message);
    } catch (error) {
      console.error("Failed to toggle visibility:", error);

      state.value = {
        ...state.value,
        loading: false,
        error: error instanceof Error
          ? error.message
          : "Failed to update visibility",
      };
    }
  };

  const cancelDialog = () => {
    state.value = {
      ...state.value,
      showConfirmDialog: false,
      error: null,
    };
  };

  const isPublic = state.value.visibility === "public";

  return (
    <>
      <div class={`recipe-privacy-toggle ${className}`}>
        <button
          type="button"
          onClick={handleToggleClick}
          disabled={state.value.loading}
          title={isPublic
            ? "Recipe is public - Click to make private"
            : "Recipe is private - Click to make public"}
          class={`
            btn btn-square
            transition-all duration-200 ease-in-out
            hover:scale-110 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
            isPublic
              ? "text-success hover:text-success/80"
              : "text-warning hover:text-warning/80"
          }
            ${state.value.loading ? "loading" : ""}
          `}
          data-visibility={state.value.visibility}
          aria-label={isPublic ? "Make recipe private" : "Make recipe public"}
        >
          {state.value.loading
            ? (
              // Loading spinner
              <span class="loading loading-spinner loading-sm"></span>
            )
            : (
              // Icon based on visibility
              isPublic
                ? (
                  // Globe icon (public)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    class="size-[1.4em]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                    />
                  </svg>
                )
                : (
                  // Lock icon (private)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    class="size-[1.4em]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
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

      {/* Confirmation Dialog */}
      {state.value.showConfirmDialog && (
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Make Recipe Private?</h3>
            <p class="py-4">
              Making this recipe private will:
            </p>
            <ul class="list-disc list-inside space-y-1 mb-4">
              <li>Remove it from public listings</li>
              <li>Remove it from other users' favorites</li>
              <li>Make it visible only to you</li>
            </ul>
            <p class="text-warning">
              This action will affect users who have saved this recipe.
            </p>
            <div class="modal-action">
              <button
                type="button"
                class="btn btn-ghost"
                onClick={cancelDialog}
                disabled={state.value.loading}
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-warning"
                onClick={toggleVisibility}
                disabled={state.value.loading}
              >
                {state.value.loading
                  ? <span class="loading loading-spinner loading-sm"></span>
                  : (
                    "Make Private"
                  )}
              </button>
            </div>
          </div>
          <div class="modal-backdrop" onClick={cancelDialog}></div>
        </div>
      )}
    </>
  );
}
