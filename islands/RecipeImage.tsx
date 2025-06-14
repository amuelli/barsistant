import { useEffect, useState } from "preact/hooks";
import { Recipe } from "../types/recipe.ts";

interface RecipeImageProps {
  recipe: Recipe;
}

export default function RecipeImage(
  { recipe: initialRecipe }: RecipeImageProps,
) {
  const [recipe, setRecipe] = useState(initialRecipe);

  useEffect(() => {
    if (recipe.image) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/recipes/${recipe.id}`);
      if (res.ok) {
        const updated = await res.json();
        if (updated.image) {
          setRecipe(updated);
          clearInterval(interval);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [recipe]);

  return recipe.image
    ? (
      <img
        src={recipe.image}
        alt={recipe.name}
        class="w-full h-96 object-contain rounded-lg shadow-lg bg-base-300"
      />
    )
    : (
      <div class="w-full h-96 skeleton rounded-lg bg-base-300 flex items-center justify-center">
        <span class="text-gray-500 animate-pulse">Generating image…</span>
      </div>
    );
}
