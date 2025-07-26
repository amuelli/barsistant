import { FreshContext } from "fresh";
import { enqueueJob } from "../../../utils/db/queue-handler.ts";
import { recipeModel } from "../../../utils/db/recipe-model.ts";
import { requireAdmin } from "../../../utils/auth/admin.ts";

export async function handler(ctx: FreshContext) {
  const id = ctx.params.id;
  if (!id) throw new Error("Missing recipe id");

  // Handle different HTTP methods
  switch (ctx.req.method) {
    case "GET":
      return await handleGet(id);
    case "PUT":
      return await handlePut(id, ctx.req);
    case "DELETE":
      return await handleDelete(id);
    case "POST":
      return await handlePost(id, ctx.req);
    default:
      return new Response(`Method ${ctx.req.method} not allowed`, {
        status: 405,
        statusText: "Method Not Allowed",
      });
  }
}

async function handleGet(id: string) {
  const recipe = await recipeModel.getById(id);
  if (!recipe) {
    return new Response("recipe not found", {
      status: 404,
      statusText: "Not Found",
    });
  }
  return Response.json(recipe);
}

async function handleDelete(id: string) {
  // First, get the recipe to determine the owner
  const existingRecipe = await recipeModel.getById(id);
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
    // First, verify that the recipe exists
    const existingRecipe = await recipeModel.getById(id);
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
    // Check if the recipe exists
    const recipe = await recipeModel.getById(id);
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
