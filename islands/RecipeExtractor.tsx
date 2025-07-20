import { useSignal } from "@preact/signals";
import { useState } from "preact/hooks";
import { User } from "../types/user.ts";

interface RecipeExtractionResult {
  success: boolean;
  recipeId?: string;
  error?: string;
}

interface RecipeExtractorProps {
  user: User | null;
}

export default function RecipeExtractor({ user }: RecipeExtractorProps) {
  const extractionState = useSignal<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const errorMessage = useSignal<string | null>(null);
  const [url, setUrl] = useState("");

  const extract = async () => {
    console.log("Extracting recipe from URL:", url);
    // Validate URL
    if (!url || !url.trim() || !url.startsWith("http")) {
      errorMessage.value = "Please enter a valid URL";
      extractionState.value = "error";
      return;
    }

    try {
      // Start loading state
      extractionState.value = "loading";
      errorMessage.value = null;

      // Send request to API endpoint
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const result: RecipeExtractionResult = await response.json();

      if (!response.ok || !result.success) {
        extractionState.value = "error";
        // Handle authentication errors specifically
        if (response.status === 401) {
          errorMessage.value = "Please sign in to extract recipes";
        } else {
          errorMessage.value = result.error || "Failed to extract recipe";
        }
        return;
      }

      // Success - redirect to the newly created recipe
      extractionState.value = "success";
      globalThis.location.href = `/recipes/${result.recipeId}`;
    } catch (error) {
      extractionState.value = "error";
      errorMessage.value = error instanceof Error
        ? error.message
        : "An unexpected error occurred";
    }
  };

  // If user is not authenticated, show sign-in prompt
  if (!user) {
    return (
      <div class="text-center p-8">
        <div class="mb-4">
          <svg
            class="w-12 h-12 mx-auto mb-4 text-warning"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">Authentication Required</h3>
        <p class="text-base-content/70 mb-4">
          Please sign in to extract recipes from URLs.
        </p>
        <a href="/auth/login" class="btn btn-primary">
          Sign In
        </a>
      </div>
    );
  }

  return (
    <>
      <div class="form-control w-full">
        <label class="label">
          <span class="label-text">Paste a link to a recipe</span>
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
          placeholder="https://example.com/cocktail-recipe"
          class={`input input-bordered w-full ${
            extractionState.value === "error" ? "input-error" : ""
          }`}
          disabled={extractionState.value === "loading"}
        />
        {errorMessage.value && (
          <label class="label">
            <span class="label-text-alt text-error">{errorMessage.value}</span>
          </label>
        )}
      </div>

      <div class="form-control mt-4">
        <button
          type="button"
          onClick={extract}
          disabled={extractionState.value === "loading"}
          class={`btn btn-primary ${
            extractionState.value === "loading" ? "btn-disabled" : ""
          }`}
        >
          {extractionState.value === "loading"
            ? (
              <>
                <span class="loading loading-spinner"></span>
                Extracting...
              </>
            )
            : (
              "Extract Recipe"
            )}
        </button>
      </div>
    </>
  );
}
