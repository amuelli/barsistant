import { FreshContext } from "fresh";
import { recipeModel } from "../../../../utils/db/recipe-model.ts";
import { requireAuth } from "../../../../utils/auth/middleware.ts";
import { kv } from "../../../../utils/db/db.ts";

/**
 * API endpoint for managing recipe visibility (public/private)
 * Only recipe owners can change visibility
 */
export async function handler(ctx: FreshContext) {
  const recipeId = ctx.params.id;
  if (!recipeId) {
    return new Response("Missing recipe ID", { status: 400 });
  }

  // Only handle POST requests for visibility operations
  if (ctx.req.method !== "POST") {
    return new Response(`Method ${ctx.req.method} not allowed`, {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  return await handlePost(recipeId, ctx.req);
}

async function handlePost(recipeId: string, req: Request) {
  try {
    // Require authentication
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      return authResult; // Return auth error response
    }
    const { user } = authResult;

    // Verify recipe exists and user owns it
    const recipe = await recipeModel.getById(recipeId);
    if (!recipe) {
      return new Response("Recipe not found", { status: 404 });
    }

    // Only recipe owner can change visibility
    if (recipe.createdBy !== user.id) {
      return new Response("Only recipe owner can change visibility", {
        status: 403,
      });
    }

    // Parse request body
    const body = await req.json();
    const action = body.action;

    if (!action || !["toggle", "setPublic", "setPrivate"].includes(action)) {
      return new Response(
        "Invalid action. Must be 'toggle', 'setPublic', or 'setPrivate'",
        {
          status: 400,
        },
      );
    }

    // Determine new visibility
    let newVisibility: "public" | "private";

    if (action === "toggle") {
      newVisibility = recipe.visibility === "public" ? "private" : "public";
    } else if (action === "setPublic") {
      if (recipe.visibility === "public") {
        return Response.json({
          success: true,
          visibility: "public",
          changed: false,
          message: "Recipe is already public",
        });
      }
      newVisibility = "public";
    } else if (action === "setPrivate") {
      if (recipe.visibility === "private") {
        return Response.json({
          success: true,
          visibility: "private",
          changed: false,
          message: "Recipe is already private",
        });
      }
      newVisibility = "private";
    } else {
      // This should never happen due to earlier validation
      return new Response("Invalid action", { status: 400 });
    }

    // Update recipe visibility using the new ULID-based structure
    // If making a public recipe private, we need to remove it from other users' collections
    let removedFromCollections = 0;
    if (recipe.visibility === "public" && newVisibility === "private") {
      // Use the recipe model's update method which handles the ULID-based structure
      await recipeModel.updateUserRecipe(recipe.createdBy, recipeId, {
        visibility: newVisibility,
      });

      // Find and remove all user collections for this recipe (except owner's)
      // This handles both the original recipe ID and public recipe ID
      const recipeIdsToClean = [recipeId];
      if (recipe.publicRecipeId) {
        recipeIdsToClean.push(recipe.publicRecipeId);
      }

      const transaction = kv.atomic();
      for (const idToClean of recipeIdsToClean) {
        for await (const entry of kv.list({ prefix: ["user_collections"] })) {
          const key = entry.key as ["user_collections", string, string];
          const userId = key[1];
          const collectionRecipeId = key[2];

          // If this is a collection entry for our recipe and not the owner's
          if (collectionRecipeId === idToClean && userId !== user.id) {
            transaction.delete(key);
            removedFromCollections++;
          }
        }
      }

      // Commit collection cleanup transaction
      if (removedFromCollections > 0) {
        const result = await transaction.commit();
        if (!result.ok) {
          throw new Error("Failed to clean up user collections");
        }
      }
    } else {
      // Simple update - just change visibility using the new structure
      await recipeModel.updateUserRecipe(recipe.createdBy, recipeId, {
        visibility: newVisibility,
      });
    }

    // Return success response with detailed information
    const response = {
      success: true,
      visibility: newVisibility,
      changed: true,
      message: newVisibility === "public"
        ? "Recipe is now public and visible to everyone"
        : `Recipe is now private. ${
          removedFromCollections > 0
            ? `Removed from ${removedFromCollections} user collection${
              removedFromCollections > 1 ? "s" : ""
            }.`
            : ""
        }`,
    };

    return Response.json(response);
  } catch (error) {
    console.error("Error managing recipe visibility:", error);
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error";

    return new Response(`Failed to update recipe visibility: ${errorMessage}`, {
      status: 500,
    });
  }
}
