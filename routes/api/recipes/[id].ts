import { enqueueJob } from "🛠️/db/queue-handler.ts";
import { recipeModel } from "🛠️/db/recipe-model.ts";
import { requireAdmin } from "🛠️/auth/admin.ts";
import { optionalAuth } from "🛠️/auth/middleware.ts";
import { define } from "../../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const id = ctx.params.id;
    if (!id) throw new Error("Missing recipe id");
    return await handleGet(id, ctx.req);
  },

  async PUT(ctx) {
    const id = ctx.params.id;
    if (!id) throw new Error("Missing recipe id");
    return await handlePut(id, ctx.req);
  },

  async DELETE(ctx) {
    const id = ctx.params.id;
    if (!id) throw new Error("Missing recipe id");
    return await handleDelete(id);
  },

  async POST(ctx) {
    const id = ctx.params.id;
    if (!id) throw new Error("Missing recipe id");
    return await handlePost(id, ctx.req);
  },
});

async function handleGet(id: string, req: Request) {
  // Check access control - use optional auth since API might be called without auth
  const authResult = await optionalAuth(req);
  const userId = authResult instanceof Response
    ? null
    : authResult?.user?.id || null;

  // Get the recipe using optimized lookup with userId if available
  const recipe = await recipeModel.getById(id, userId || undefined);
  if (!recipe) {
    return new Response("recipe not found", {
      status: 404,
      statusText: "Not Found",
    });
  }

  // Check if user can access this recipe
  const canAccess = await recipeModel.canUserAccessRecipe(id, userId);
  if (!canAccess) {
    return new Response("This recipe is private", {
      status: 403,
      statusText: "Forbidden",
    });
  }

  return Response.json(recipe);
}

async function handleDelete(id: string) {
  // First, get the recipe to determine the owner (admin context)
  const existingRecipe = await recipeModel.getByIdForAdmin(id);
  if (!existingRecipe) {
    return new Response("recipe not found", {
      status: 404,
      statusText: "Not Found",
    });
  }

  // Use ULID-based delete method
  const success = await recipeModel.deleteUserRecipe(
    existingRecipe.createdBy,
    id,
  );
  if (!success) {
    return new Response("recipe not found", {
      status: 404,
      statusText: "Not Found",
    });
  }
  return new Response(null, {
    status: 204,
    statusText: "No Content",
  });
}

async function handlePut(id: string, req: Request) {
  try {
    // First, verify that the recipe exists (admin context)
    const existingRecipe = await recipeModel.getByIdForAdmin(id);
    if (!existingRecipe) {
      return new Response("recipe not found", {
        status: 404,
        statusText: "Not Found",
      });
    }

    // Parse request body
    const updates = await req.json();

    // Update the recipe using ULID-based method
    const updatedRecipe = await recipeModel.updateUserRecipe(
      existingRecipe.createdBy,
      id,
      updates,
    );

    return Response.json(updatedRecipe);
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error";

    return new Response(`Failed to update recipe: ${errorMessage}`, {
      status: 400,
      statusText: "Bad Request",
    });
  }
}

async function handlePost(id: string, req: Request) {
  try {
    // Check if the recipe exists (admin context)
    const recipe = await recipeModel.getByIdForAdmin(id);
    if (!recipe) {
      return new Response("recipe not found", {
        status: 404,
        statusText: "Not Found",
      });
    }

    // Parse request to determine what action to perform
    const body = await req.json();

    // Handle regenerating image
    if (body.action === "regenerateImage") {
      // Check admin authorization for regenerate action
      const adminCheck = await requireAdmin(req);
      if (adminCheck instanceof Response) {
        return adminCheck; // Return the error response
      }

      // Enqueue a job to generate a new image
      await enqueueJob({
        type: "generate_recipe_raster_image",
        recipeId: id,
      });

      return Response.json({
        message: "raster image regeneration job enqueued",
        recipeId: id,
      });
    }

    // If action is not recognized
    return new Response(`Unknown action: ${body.action}`, {
      status: 400,
      statusText: "Bad Request",
    });
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error";

    return new Response(`Failed to process recipe action: ${errorMessage}`, {
      status: 400,
      statusText: "Bad Request",
    });
  }
}
