import { FreshContext } from "fresh";
import { recipeModel } from "../../../utils/recipe-model.ts";

export async function handler(ctx: FreshContext) {
  const id = ctx.params.id;
  if (!id) throw new Error("Missing recipe id");
  const recipe = await recipeModel.getById(id);
  if (!recipe) {
    return new Response("recipe not found", {
      status: 404,
      statusText: "Not Found",
    });
  }
  return Response.json(recipe);
}
