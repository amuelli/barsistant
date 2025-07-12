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

    // Handle GET request for listing all recipes
    if (req.method === "GET") {
      try {
        const url = new URL(req.url);
        const limit = url.searchParams.get("limit");
        const cursor = url.searchParams.get("cursor") || "";
        const search = url.searchParams.get("search");

        // If search query is provided, use search functionality
        if (search) {
          const recipes = await recipeModel.search({
            query: search,
            limit: limit ? parseInt(limit) : 50,
          });

          return new Response(
            JSON.stringify({
              recipes,
              total: recipes.length,
              hasMore: false, // Search doesn't support pagination yet
              cursor: "",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Use pagination for listing all recipes
        const result = await recipeModel.listPage({
          limit: limit ? parseInt(limit) : 30,
          cursor: cursor,
        });

        return new Response(
          JSON.stringify({
            recipes: result.items,
            hasMore: result.cursor !== "",
            cursor: result.cursor,
            total: result.items.length,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (error) {
        console.error("Error fetching recipes:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to fetch recipes",
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
          "Allow": "GET",
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
