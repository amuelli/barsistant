import { createLogoutResponse, requireAuth } from "🛠️/auth/middleware.ts";
import { deleteUserSession } from "🛠️/auth/session.ts";
import { updateUserPreferences } from "🛠️/auth/user.ts";
import { define } from "🛠️/define.ts";
import { User, UserPreferences } from "../types/user.ts";

interface ProfileData {
  user: User;
  editPreferences?: boolean;
}

export const handler = define.handlers<ProfileData>({
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
    const url = new URL(ctx.req.url);
    const editPreferences = url.searchParams.get("editPreferences") === "true";

    return { data: { user, editPreferences } };
  },

  async POST(ctx) {
    const formData = await ctx.req.formData();
    const action = formData.get("_action");

    // Require authentication for all POST actions
    const authResult = await requireAuth(ctx.req);
    if (authResult instanceof Response) {
      return new Response(null, {
        status: 302,
        headers: { "Location": "/auth/login" },
      });
    }
    const { user } = authResult;

    if (action === "signOut") {
      // Get session ID from cookie
      const cookies = ctx.req.headers.get("cookie") || "";
      const sessionMatch = cookies.match(/session=([^;]+)/);
      const sessionId = sessionMatch ? sessionMatch[1] : null;

      if (sessionId) {
        // Delete the session from database
        await deleteUserSession(sessionId);
      }

      // Return a logout response that clears the session cookie
      return createLogoutResponse(null, {
        status: 302,
        headers: { "Location": "/auth/login" },
      });
    } else if (action === "editPreferences") {
      // Redirect to the same page with edit mode enabled
      return new Response(null, {
        status: 302,
        headers: { "Location": "/profile?editPreferences=true" },
      });
    } else if (action === "updatePreferences") {
      // Update user preferences
      const theme = formData.get("theme") as "light" | "dark" | "system";
      const preferredMeasurementUnit = formData.get("measurementUnit") as
        | "metric"
        | "imperial"
        | "both";

      // Create partial preferences object
      const updatedPreferences: Partial<UserPreferences> = {
        theme,
        preferredMeasurementUnit,
      };

      // Update user preferences
      await updateUserPreferences(user.id, updatedPreferences);

      // Redirect back to profile page in view mode
      return new Response(null, {
        status: 302,
        headers: { "Location": "/profile" },
      });
    } else if (action === "cancelEdit") {
      // Redirect back to profile page in view mode
      return new Response(null, {
        status: 302,
        headers: { "Location": "/profile" },
      });
    }

    // For other actions, redirect back to profile
    return new Response(null, {
      status: 302,
      headers: { "Location": "/profile" },
    });
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

            {data.editPreferences
              ? (
                <form method="post" class="space-y-4">
                  <input
                    type="hidden"
                    name="_action"
                    value="updatePreferences"
                  />

                  <div>
                    <label class="label">
                      <span class="label-text font-medium">Theme</span>
                    </label>
                    <select name="theme" class="select select-bordered w-full">
                      <option
                        value="light"
                        selected={user.preferences.theme === "light"}
                      >
                        Light
                      </option>
                      <option
                        value="dark"
                        selected={user.preferences.theme === "dark"}
                      >
                        Dark
                      </option>
                      <option
                        value="system"
                        selected={user.preferences.theme === "system"}
                      >
                        System
                      </option>
                    </select>
                  </div>

                  <div>
                    <label class="label">
                      <span class="label-text font-medium">
                        Measurement Unit
                      </span>
                    </label>
                    <select
                      name="measurementUnit"
                      class="select select-bordered w-full"
                    >
                      <option
                        value="metric"
                        selected={user.preferences.preferredMeasurementUnit ===
                          "metric"}
                      >
                        Metric
                      </option>
                      <option
                        value="imperial"
                        selected={user.preferences.preferredMeasurementUnit ===
                          "imperial"}
                      >
                        Imperial
                      </option>
                      <option
                        value="both"
                        selected={user.preferences.preferredMeasurementUnit ===
                          "both"}
                      >
                        Both
                      </option>
                    </select>
                  </div>

                  <div class="card-actions justify-end mt-6 space-x-2">
                    <button
                      type="submit"
                      name="_action"
                      value="cancelEdit"
                      class="btn btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      class="btn btn-primary"
                    >
                      Save Preferences
                    </button>
                  </div>
                </form>
              )
              : (
                <>
                  <div class="space-y-4">
                    <div>
                      <label class="label">
                        <span class="label-text font-medium">Theme</span>
                      </label>
                      <div class="text-base-content/80">
                        {user.preferences.theme.charAt(0).toUpperCase() +
                          user.preferences.theme.slice(1)}
                      </div>
                    </div>

                    <div>
                      <label class="label">
                        <span class="label-text font-medium">
                          Measurement Unit
                        </span>
                      </label>
                      <div class="text-base-content/80">
                        {user.preferences.preferredMeasurementUnit.charAt(0)
                          .toUpperCase() +
                          user.preferences.preferredMeasurementUnit.slice(1)}
                      </div>
                    </div>
                  </div>

                  <div class="card-actions justify-end mt-6">
                    <form method="post">
                      <button
                        type="submit"
                        name="_action"
                        value="editPreferences"
                        class="btn btn-primary"
                      >
                        Edit Preferences
                      </button>
                    </form>
                  </div>
                </>
              )}
          </div>
        </div>
        {/* Account Actions Card */}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title mb-4">Account Actions</h2>

            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="font-medium">Sign Out</h3>
                  <p class="text-sm text-base-content/70">
                    Log out of your account
                  </p>
                </div>
                <form method="post">
                  <button
                    type="submit"
                    name="_action"
                    value="signOut"
                    class="btn btn-outline btn-primary btn-sm"
                  >
                    Sign Out
                  </button>
                </form>
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
