import { requireAdmin } from "../../../../utils/auth/admin.ts";
import { recipeModel } from "../../../../utils/db/recipe-model.ts";
import { define } from "../../../../utils.ts";

export const handler = define.handlers({
  async DELETE(ctx) {
    try {
      // Require admin authentication
      const authResult = await requireAdmin(ctx.req);

      if (authResult instanceof Response) {
        return authResult;
      }

      const { user } = authResult;
      const recipeId = ctx.params.id;

      if (!recipeId) {
        return new Response(
          JSON.stringify({ error: "Recipe ID is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // First get the recipe to determine the owner (admin access)
      const existingRecipe = await recipeModel.getByIdForAdmin(recipeId);
      if (!existingRecipe) {
        return new Response(
          JSON.stringify({ error: "Recipe not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Use ULID-based delete method
      const deleted = await recipeModel.deleteUserRecipe(
        existingRecipe.createdBy,
        recipeId,
      );

      if (!deleted) {
        return new Response(
          JSON.stringify({ error: "Recipe not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Log the admin action for audit purposes
      console.log(`Admin ${user.email} deleted recipe ${recipeId}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Recipe deleted successfully",
          recipeId,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Error deleting recipe:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to delete recipe",
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },

  async GET(ctx) {
    try {
      // Require admin authentication
      const authResult = await requireAdmin(ctx.req);

      if (authResult instanceof Response) {
        return authResult;
      }

      const recipeId = ctx.params.id;

      if (!recipeId) {
        return new Response(
          JSON.stringify({ error: "Recipe ID is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const recipe = await recipeModel.getByIdForAdmin(recipeId);

      if (!recipe) {
        return new Response(
          JSON.stringify({ error: "Recipe not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({ recipe }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Error fetching recipe:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch recipe",
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
});
