import { requireAuth } from "🛠️/auth/middleware.ts";
import { recipeModel } from "🛠️/db/recipe-model.ts";
import { define } from "🛠️/define.ts";

/**
 * API endpoint for saving/removing public recipes to/from user's collection
 * Creates a copy of the recipe in the user's namespace when saving
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

    if (!action || action !== "add") {
      return new Response(
        "Invalid action. Must be 'add'",
        {
          status: 400,
        },
      );
    }

    // Prevent users from copying their own recipes
    if (recipe.createdBy === user.id) {
      return new Response("Cannot save your own recipe", {
        status: 400,
      });
    }

    // Only allow copying public recipes
    if (recipe.visibility !== "public") {
      return new Response("Cannot save private recipes", {
        status: 400,
      });
    }

    // Check if user already has a copy of this recipe
    const userRecipes = await recipeModel.listUserRecipes(user.id);
    const existingCopy = userRecipes.find((r) =>
      r.originalRecipeId === recipeId
    );

    if (existingCopy) {
      return new Response("Recipe already saved to your collection", {
        status: 409,
      });
    }

    // Create a copy of the recipe for the user
    const copiedRecipe = await recipeModel.copyRecipe(
      recipeId,
      user.id,
      "private",
    );

    // Return success response
    return Response.json({
      success: true,
      userCopyId: copiedRecipe.id,
      message: "Recipe saved to your collection",
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
