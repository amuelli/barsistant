import { define } from "../../utils.ts";
import { checkAdminFromUser } from "🛠️/auth/admin.ts";

interface AdminData {
  isAdmin: boolean;
}

export const handler = define.handlers<AdminData>({
  GET(ctx) {
    ctx.state.title = "Admin Dashboard";

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
      <div class="container mx-auto px-4 py-8 max-w-6xl">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-base-content mb-2">
            Admin Dashboard
          </h1>
          <p class="text-base-content/70">
            Manage recipes and system settings
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Recipe Management Card */}
          <div class="card bg-base-200 shadow-lg">
            <div class="card-body">
              <h2 class="card-title text-primary">
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Recipe Management
              </h2>
              <p class="text-base-content/70">
                View, edit, and delete recipes in the system
              </p>
              <div class="card-actions justify-end">
                <a href="/admin/recipes" class="btn btn-primary btn-sm">
                  Manage Recipes
                </a>
              </div>
            </div>
          </div>

          {/* System Stats Card */}
          <div class="card bg-base-200 shadow-lg">
            <div class="card-body">
              <h2 class="card-title text-secondary">
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                System Statistics
              </h2>
              <p class="text-base-content/70">
                View system usage and performance metrics
              </p>
              <div class="card-actions justify-end">
                <button type="button" class="btn btn-secondary btn-sm" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </div>

          {/* User Management Card */}
          <div class="card bg-base-200 shadow-lg">
            <div class="card-body">
              <h2 class="card-title text-accent">
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
                User Management
              </h2>
              <p class="text-base-content/70">
                View user accounts and activity
              </p>
              <div class="card-actions justify-end">
                <button type="button" class="btn btn-accent btn-sm" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div class="mt-8">
          <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
          <div class="flex flex-wrap gap-4">
            <a href="/extract" class="btn btn-outline btn-sm">
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add New Recipe
            </a>
            <a href="/recipes" class="btn btn-outline btn-sm">
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Browse All Recipes
            </a>
          </div>
        </div>
      </div>
    );
  },
);
