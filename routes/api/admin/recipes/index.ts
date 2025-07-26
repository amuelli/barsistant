import { requireAdmin } from "../../../../utils/auth/admin.ts";
import { recipeModel } from "../../../../utils/db/recipe-model.ts";
import { findUserById } from "../../../../utils/auth/user.ts";
import { define } from "../../../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    try {
      // Require admin authentication
      const authResult = await requireAdmin(ctx.req);

      if (authResult instanceof Response) {
        return authResult;
      }
      try {
        const url = new URL(ctx.req.url);
        const limit = url.searchParams.get("limit");
        const cursor = url.searchParams.get("cursor") || "";
        const search = url.searchParams.get("search");

        // If search query is provided, use search functionality
        if (search) {
          const recipes = await recipeModel.searchUserRecipesForAdmin({
            query: search,
            limit: limit ? parseInt(limit) : 50,
          });

          // Resolve user emails for each recipe
          const recipesWithEmails = await Promise.all(
            recipes.map(async (recipe) => {
              let createdByEmail = "Unknown";
              if (recipe.createdBy) {
                try {
                  const user = await findUserById(recipe.createdBy);
                  if (user?.email) {
                    createdByEmail = user.email;
                  }
                } catch (error) {
                  console.error(
                    `Failed to lookup user ${recipe.createdBy}:`,
                    error,
                  );
                }
              }
              return { ...recipe, createdByEmail };
            }),
          );

          return new Response(
            JSON.stringify({
              recipes: recipesWithEmails,
              total: recipesWithEmails.length,
              hasMore: false, // Search doesn't support pagination
              cursor: "",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Use pagination for listing all user recipes
        const result = await recipeModel.listUserRecipesForAdmin({
          limit: limit ? parseInt(limit) : 30,
          cursor: cursor,
        });

        // Resolve user emails for each recipe
        const recipesWithEmails = await Promise.all(
          result.items.map(async (recipe) => {
            let createdByEmail = "Unknown";
            if (recipe.createdBy) {
              try {
                const user = await findUserById(recipe.createdBy);
                if (user?.email) {
                  createdByEmail = user.email;
                }
              } catch (error) {
                console.error(
                  `Failed to lookup user ${recipe.createdBy}:`,
                  error,
                );
              }
            }
            return { ...recipe, createdByEmail };
          }),
        );

        return new Response(
          JSON.stringify({
            recipes: recipesWithEmails,
            hasMore: result.cursor !== "",
            cursor: result.cursor,
            total: result.total,
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
  },
});
