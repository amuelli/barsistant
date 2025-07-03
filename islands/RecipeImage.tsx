import { useEffect, useState } from "preact/hooks";
import { Recipe } from "../types/recipe.ts";
import { getBackgroundColor } from "../utils/color-utils.tsx";

interface RecipeImageProps {
  recipe: Recipe;
}

export default function RecipeImage(
  { recipe: initialRecipe }: RecipeImageProps,
) {
  const [recipe, setRecipe] = useState(initialRecipe);

  useEffect(() => {
    if (getImageUrl(recipe)) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/recipes/${recipe.id}`);
      if (res.ok) {
        const updated = await res.json();

        setRecipe(updated);

        if (getImageUrl(updated)) {
          clearInterval(interval);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [recipe]);

  return getImageUrl(recipe)
    ? (
      <div class="w-full h-96 relative rounded-lg shadow-lg">
        <div
          style={{ backgroundColor: getBackgroundColor(recipe) }}
          class="absolute inset-0 opacity-30 rounded-lg"
        >
        </div>
        <img
          src={getImageUrl(recipe)}
          alt={recipe.name}
          class="w-full h-96 object-contain relative z-10 rounded-lg"
        />
      </div>
    )
    : isImageGenerating(recipe)
    ? (
      <div class="w-full h-96 flex flex-col items-center justify-center rounded-lg bg-base-300 animate-pulse">
        <span class="text-gray-500">Generating image…</span>
      </div>
    )
    : (
      <div class="w-full h-96 flex flex-col items-center justify-center rounded-lg bg-base-300">
        <span class="text-gray-400">No image available</span>
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
    recipe.images?.vector?.status === "generating" ||
    recipe.images?.raster?.status === "generating"
  );
}
