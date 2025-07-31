import { useEffect, useState } from "preact/hooks";
import { getGradientBackground } from "🛠️/color-utils.tsx";
import { Recipe } from "../types/recipe.ts";

interface RecipeImageProps {
  recipe: Recipe;
  className?: string;
  imageClassName?: string;
  maxHeight?: string;
  showRegenerateButton?: boolean;
  showGradientBackground?: boolean;
  gradientOpacity?: number;
  isAdmin?: boolean;
  defaultWidth?: number;
  defaultHeight?: number;
}

export default function RecipeImage(
  {
    recipe: initialRecipe,
    className = "w-full max-h-[250px] md:max-h-[300px]",
    imageClassName =
      "w-full max-h-[250px] md:max-h-[300px] object-contain relative rounded-lg",
    maxHeight,
    showRegenerateButton = true,
    showGradientBackground = true,
    gradientOpacity = 0.2,
    isAdmin = false,
    defaultWidth = 800,
    defaultHeight = 600,
  }: RecipeImageProps,
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
      const res = await fetch(`/api/admin/recipes/${recipe.id}`, {
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

  // Apply custom max height if provided
  // This style will override the class-based height constraints if specified
  const containerStyle = maxHeight ? { maxHeight } : {};

  // Generate gradient background if enabled
  const gradientBackground = showGradientBackground
    ? getGradientBackground(recipe)
    : undefined;

  return isImageGenerating(recipe) || isRegenerating
    ? (
      <div
        class={`flex flex-col items-center justify-center rounded-lg bg-base-300 animate-pulse ${className}`}
        style={{
          ...containerStyle,
          aspectRatio: `${defaultWidth} / ${defaultHeight}`,
        }}
      >
        <span class="text-gray-500">Generating image…</span>
      </div>
    )
    : getImageUrl(recipe)
    ? (
      <div
        class={`relative rounded-lg group ${className} overflow-hidden`}
        style={containerStyle}
      >
        {showGradientBackground && (
          <div
            class="absolute inset-0"
            style={{
              background: gradientBackground,
              opacity: gradientOpacity,
            }}
          >
          </div>
        )}
        <img
          src={getImageUrl(recipe)}
          alt={recipe.name}
          class={`${imageClassName} relative`}
          style={containerStyle}
          width={defaultWidth}
          height={defaultHeight}
        />
        {showRegenerateButton && isAdmin && (
          <div class="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleRegenerateImage}
              disabled={isImageGenerating(recipe) || isRegenerating}
              class="btn btn-primary bg-opacity-80 hover:bg-opacity-100"
            >
              {isImageGenerating(recipe) ? "Generating..." : "Regenerate Image"}
            </button>
          </div>
        )}
      </div>
    )
    : (
      <div
        class={`flex flex-col items-center justify-center rounded-lg bg-base-300 ${className}`}
        style={{
          ...containerStyle,
          aspectRatio: `${defaultWidth} / ${defaultHeight}`,
        }}
      >
        <span class="text-gray-400 mb-4">No image available</span>
        {showRegenerateButton && isAdmin && (
          <button
            type="button"
            onClick={handleRegenerateImage}
            disabled={isRegenerating}
            class="btn btn-primary btn-sm md:btn-md"
          >
            {isRegenerating ? "Requesting..." : "Generate Image"}
          </button>
        )}
      </div>
    );
}

// Export these utility functions so they can be reused elsewhere
export function getImageUrl(
  recipe: Recipe,
): string | undefined {
  if (recipe.images?.vector?.url) return recipe.images.vector.url;
  if (recipe.images?.raster?.url) return recipe.images.raster.url;
  return undefined;
}

export function isImageGenerating(
  recipe: Recipe,
): boolean {
  return (
    recipe.images?.raster?.status === "generating"
  );
}
