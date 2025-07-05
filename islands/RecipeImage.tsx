import { useEffect, useState } from "preact/hooks";
import { Recipe } from "../types/recipe.ts";
import { getGradientBackground } from "../utils/color-utils.tsx";

interface RecipeImageProps {
  recipe: Recipe;
}

export default function RecipeImage(
  { recipe: initialRecipe }: RecipeImageProps,
) {
  const [recipe, setRecipe] = useState(initialRecipe);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (!isImageGenerating(recipe)) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/recipes/${recipe.id}`);
      if (res.ok) {
        const updated = await res.json();

        setRecipe(updated);

        if (getImageUrl(updated)) {
          clearInterval(interval);
          setIsRegenerating(false);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [recipe]);

  // Handle regenerate image request
  const handleRegenerateImage = async () => {
    try {
      setIsRegenerating(true);
      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "regenerateImage" }),
      });

      if (res.ok) {
        // Update the local state to show generating status
        setRecipe({
          ...recipe,
          images: {
            raster: {
              ...recipe.images?.raster,
              status: "generating",
            },
          },
        });
      } else {
        setIsRegenerating(false);
        console.error("Failed to regenerate image:", await res.text());
      }
    } catch (error) {
      setIsRegenerating(false);
      console.error("Failed to regenerate image:", error);
    }
  };

  return isImageGenerating(recipe) || isRegenerating
    ? (
      <div class="w-full h-96 flex flex-col items-center justify-center rounded-lg bg-base-300 animate-pulse">
        <span class="text-gray-500">Generating image…</span>
      </div>
    )
    : getImageUrl(recipe)
    ? (
      <div class="w-full h-96 relative rounded-lg group">
        <div
          style={{ background: getGradientBackground(recipe) }}
          class="absolute inset-0 opacity-15 rounded-lg"
        >
        </div>
        <img
          src={getImageUrl(recipe)}
          alt={recipe.name}
          class="w-full h-96 object-contain relative rounded-lg"
        />
        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleRegenerateImage}
            disabled={isImageGenerating(recipe) || isRegenerating}
            class="btn btn-primary bg-opacity-80 hover:bg-opacity-100"
          >
            {isImageGenerating(recipe) ? "Generating..." : "Regenerate Image"}
          </button>
        </div>
      </div>
    )
    : (
      <div class="w-full h-96 flex flex-col items-center justify-center rounded-lg bg-base-300">
        <span class="text-gray-400 mb-4">No image available</span>
        <button
          type="button"
          onClick={handleRegenerateImage}
          disabled={isRegenerating}
          class="btn btn-primary"
        >
          {isRegenerating ? "Requesting..." : "Generate Image"}
        </button>
      </div>
    );
}

function getImageUrl(
  recipe: Recipe,
): string | undefined {
  if (recipe.images?.vector?.url) return recipe.images.vector.url;
  if (recipe.images?.raster?.url) return recipe.images.raster.url;
  return undefined;
}

function isImageGenerating(
  recipe: Recipe,
): boolean {
  return (
    recipe.images?.raster?.status === "generating"
  );
}
