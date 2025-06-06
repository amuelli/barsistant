import { useSignal } from "@preact/signals";
import { useState } from "preact/hooks";

interface RecipeExtractionResult {
  success: boolean;
  recipeId?: string;
  error?: string;
}

export default function RecipeExtractor() {
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
        errorMessage.value = result.error || "Failed to extract recipe";
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
