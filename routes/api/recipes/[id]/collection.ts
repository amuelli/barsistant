import { recipeModel } from "🛠️/db/recipe-model.ts";
import { userCollectionModel } from "🛠️/db/user-collection-model.ts";
import { requireAuth } from "🛠️/auth/middleware.ts";
import type { UserCollection } from "../../../../types/user.ts";
import { define } from "../../../../utils.ts";

/**
 * API endpoint for managing recipe collections (favorites)
 * Handles adding/removing public recipes from user collections
 */
export const handler = define.handlers({
  async POST(ctx) {
    const recipeId = ctx.params.id;
    if (!recipeId) {
      return new Response("Missing recipe ID", { status: 400 });
    }

    return await handlePost(recipeId, ctx.req);
  },
});

async function handlePost(recipeId: string, req: Request) {
  try {
    // Require authentication
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      return authResult; // Return auth error response
    }
    const { user } = authResult;

    // Verify recipe exists
    const recipe = await recipeModel.getById(recipeId, user.id);
    if (!recipe) {
      return new Response("Recipe not found", { status: 404 });
    }

    // Check if user can access this recipe (must be public or owned by user)
    const canAccess = await recipeModel.canUserAccessRecipe(recipeId, user.id);
    if (!canAccess) {
      return new Response("Recipe not accessible", { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const action = body.action;

    if (!action || !["toggle", "add", "remove"].includes(action)) {
      return new Response(
        "Invalid action. Must be 'toggle', 'add', or 'remove'",
        {
          status: 400,
        },
      );
    }

    // Prevent users from favoriting their own recipes
    if (recipe.createdBy === user.id) {
      return new Response("Cannot add your own recipe to favorites", {
        status: 400,
      });
    }

    // Only allow favoriting public recipes
    if (recipe.visibility !== "public") {
      return new Response("Cannot add private recipe to favorites", {
        status: 400,
      });
    }

    let result: {
      action: "added" | "removed";
      collection: UserCollection | null;
    };

    if (action === "toggle") {
      // Toggle recipe in collection
      result = await userCollectionModel.toggleInCollection(
        user.id,
        recipeId,
        "saved", // Public recipes are saved as "saved" type
        "Added to favorites",
      );
    } else if (action === "add") {
      // Explicit add - check if already in collection first
      const inCollection = await userCollectionModel.isInUserCollection(
        user.id,
        recipeId,
      );
      if (inCollection) {
        return new Response("Recipe already in collection", { status: 409 });
      }

      const collection = await userCollectionModel.addToCollection(
        user.id,
        recipeId,
        "saved",
        "Added to favorites",
      );
      result = { action: "added", collection };
    } else if (action === "remove") {
      // Explicit remove - check if in collection first
      const inCollection = await userCollectionModel.isInUserCollection(
        user.id,
        recipeId,
      );
      if (!inCollection) {
        return new Response("Recipe not in collection", { status: 404 });
      }

      const success = await userCollectionModel.removeFromCollection(
        user.id,
        recipeId,
      );
      if (!success) {
        return new Response("Failed to remove from collection", {
          status: 500,
        });
      }
      result = { action: "removed", collection: null };
    } else {
      // This should never happen due to the earlier validation, but TypeScript needs it
      return new Response("Invalid action", { status: 400 });
    }

    // Return success response
    return Response.json({
      success: true,
      action: result.action,
      inCollection: result.action === "added",
      message: result.action === "added"
        ? "Recipe added to your favorites"
        : "Recipe removed from your favorites",
    });
  } catch (error) {
    console.error("Error managing recipe collection:", error);
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error";

    return new Response(`Failed to manage recipe collection: ${errorMessage}`, {
      status: 500,
    });
  }
}
