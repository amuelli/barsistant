import { define } from "../../utils.ts";
import { checkAdminFromUser } from "../../utils/auth/admin.ts";
import AdminRecipeManager from "../../islands/AdminRecipeManager.tsx";

interface AdminRecipesData {
  isAdmin: boolean;
}

export const handler = define.handlers<AdminRecipesData>({
  GET(ctx) {
    ctx.state.title = "Admin - Recipe Management";

    // Check if user is admin (redirect if not)
    const user = ctx.state.user;
    const isAdmin = checkAdminFromUser(user);

    if (!isAdmin) {
      return new Response(null, {
        status: 302,
        headers: { "Location": "/" },
      });
    }

    return { data: { isAdmin } };
  },
});

export default define.page<typeof handler>(
  ({ data: _data }) => {
    return (
      <div class="container mx-auto px-4 py-8 max-w-7xl">
        <div class="mb-6">
          <div class="flex items-center gap-2 text-sm breadcrumbs mb-4">
            <ul>
              <li>
                <a href="/admin" class="link link-hover">Admin</a>
              </li>
              <li>Recipe Management</li>
            </ul>
          </div>

          <h1 class="text-3xl font-bold text-base-content mb-2">
            Recipe Management
          </h1>
          <p class="text-base-content/70">
            View, search, and manage all recipes in the system
          </p>
        </div>

        {/* Recipe Management Component */}
        <AdminRecipeManager />
      </div>
    );
  },
);
