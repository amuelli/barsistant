import { FreshContext } from "fresh";
import { requireAdmin } from "../../../../utils/auth/admin.ts";
import { recipeModel } from "../../../../utils/db/recipe-model.ts";
import { State } from "../../../../utils.ts";

export async function handler(
  ctx: FreshContext<State>,
): Promise<Response> {
  const req = ctx.req;
  try {
    // Require admin authentication
    const authResult = await requireAdmin(req);

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

    // Handle DELETE request for recipe deletion
    if (req.method === "DELETE") {
      try {
        const deleted = await recipeModel.delete(recipeId);

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
    }

    // Handle GET request for recipe details (admin view)
    if (req.method === "GET") {
      try {
        const recipe = await recipeModel.getById(recipeId);

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
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Allow": "GET, DELETE",
        },
      },
    );
  } catch (error) {
    console.error("Admin API error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
