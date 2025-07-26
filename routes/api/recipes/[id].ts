import { recipeModel } from "🛠️/db/recipe-model.ts";
import { define } from "🛠️/define.ts";

export const handler = define.handlers({
  async GET({ params: { id }, state: { user } }) {
    if (!id) throw new Error("Missing recipe id");
    return await handleGet(id, user?.id ?? null);
  },

  async PUT({ params: { id }, state: { user }, req }) {
    if (!id) throw new Error("Missing recipe id");
    return await handlePut(id, user?.id ?? null, req);
  },

  async DELETE({ params: { id }, state: { user } }) {
    if (!id) throw new Error("Missing recipe id");
    return await handleDelete(id, user?.id ?? null);
  },
});

async function handleGet(id: string, userId: string | null) {
  const recipe = await recipeModel.getById(id, userId);
  if (!recipe) {
    return new Response("recipe not found", {
      status: 404,
      statusText: "Not Found",
    });
  }

  return Response.json(recipe);
}

async function handleDelete(id: string, userId: string | null) {
  // First, verify that the recipe exists
  const existingRecipe = await recipeModel.getById(id, userId);
  if (!existingRecipe) {
    return new Response("recipe not found", {
      status: 404,
      statusText: "Not Found",
    });
  }

  // Check whether the user is the owner of the recipe and is allowed to delete it.
  if (existingRecipe.createdBy !== userId) {
    return new Response("Not authorized", {
      status: 403,
      statusText: "Forbidden",
    });
  }

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

async function handlePut(id: string, userId: string | null, req: Request) {
  try {
    // First, verify that the recipe exists
    const existingRecipe = await recipeModel.getById(id, userId);
    if (!existingRecipe) {
      return new Response("recipe not found", {
        status: 404,
        statusText: "Not Found",
      });
    }

    // Check whether the user is the owner of the recipe and is allowed to update it.
    if (existingRecipe.createdBy !== userId) {
      return new Response("Not authorized", {
        status: 403,
        statusText: "Forbidden",
      });
    }

    // Parse request body
    const updates = await req.json();

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
