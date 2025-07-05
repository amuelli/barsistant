import { FreshContext } from "fresh";
import { recipeModel } from "../../../utils/db/recipe-model.ts";

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
  const success = await recipeModel.delete(id);
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

    // Update the recipe (allowing partial updates)
    const updatedRecipe = await recipeModel.update(id, updates);

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
