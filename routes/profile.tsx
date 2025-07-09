import { define } from "../utils.ts";
import { requireAuth } from "../utils/auth/middleware.ts";

export const handler = define.handlers({
  async GET(ctx) {
    ctx.state.title = "Profile";

    // Require authentication to access profile
    const authResult = await requireAuth(ctx.req);
    if (authResult instanceof Response) {
      return new Response(null, {
        status: 302,
        headers: { "Location": "/auth/login" },
      });
    }

    const { user } = authResult;
    return { data: { user } };
  },
});

export default define.page<typeof handler>(({ data }) => {
  const { user } = data;

  return (
    <div class="container mx-auto p-4 max-w-2xl">
      <div class="mb-6">
        <h1 class="text-4xl font-bold mb-2">Profile</h1>
        <p class="text-base-content/70">
          Manage your account settings and preferences
        </p>
      </div>

      <div class="space-y-6">
        {/* User Information Card */}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title mb-4">Account Information</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="label">
                  <span class="label-text font-medium">Email</span>
                </label>
                <div class="text-base-content/80">{user.email}</div>
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">Display Name</span>
                </label>
                <div class="text-base-content/80">{user.displayName}</div>
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">Member Since</span>
                </label>
                <div class="text-base-content/80">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">Last Login</span>
                </label>
                <div class="text-base-content/80">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString()
                    : "Never"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Card */}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title mb-4">Preferences</h2>

            <div class="space-y-4">
              <div>
                <label class="label">
                  <span class="label-text font-medium">Theme</span>
                </label>
                <div class="text-base-content/80">{user.preferences.theme}</div>
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">Measurement Unit</span>
                </label>
                <div class="text-base-content/80">
                  {user.preferences.preferredMeasurementUnit}
                </div>
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">
                    Show Alcohol Content
                  </span>
                </label>
                <div class="text-base-content/80">
                  {user.preferences.showAlcoholContent ? "Yes" : "No"}
                </div>
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">Show Calories</span>
                </label>
                <div class="text-base-content/80">
                  {user.preferences.showCalories ? "Yes" : "No"}
                </div>
              </div>

              {user.preferences.favoriteSpirits.length > 0 && (
                <div>
                  <label class="label">
                    <span class="label-text font-medium">Favorite Spirits</span>
                  </label>
                  <div class="flex flex-wrap gap-2">
                    {user.preferences.favoriteSpirits.map((spirit) => (
                      <span key={spirit} class="badge badge-primary">
                        {spirit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {user.preferences.dislikedIngredients.length > 0 && (
                <div>
                  <label class="label">
                    <span class="label-text font-medium">
                      Disliked Ingredients
                    </span>
                  </label>
                  <div class="flex flex-wrap gap-2">
                    {user.preferences.dislikedIngredients.map((ingredient) => (
                      <span key={ingredient} class="badge badge-error">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div class="card-actions justify-end mt-6">
              <button type="button" class="btn btn-primary">
                Edit Preferences
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions Card */}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title mb-4">Account Actions</h2>

            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="font-medium">Export Data</h3>
                  <p class="text-sm text-base-content/70">
                    Download your account data
                  </p>
                </div>
                <button type="button" class="btn btn-outline btn-sm">
                  Export
                </button>
              </div>

              <div class="divider"></div>

              <div class="flex justify-between items-center">
                <div>
                  <h3 class="font-medium text-error">Delete Account</h3>
                  <p class="text-sm text-base-content/70">
                    Permanently delete your account
                  </p>
                </div>
                <button type="button" class="btn btn-outline btn-error btn-sm">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
