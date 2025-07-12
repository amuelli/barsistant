import { useContext } from "preact/hooks";
import { User } from "../types/user.ts";
import { AuthContext } from "../utils/auth/context.ts";

interface AuthNavProps {
  user?: User | null;
  isAdmin?: boolean;
}

export default function AuthNav(
  { user: propUser, isAdmin: propIsAdmin }: AuthNavProps = {},
) {
  const context = useContext(AuthContext);

  // Use prop user if provided, otherwise fall back to context
  const user = propUser ?? context?.user;
  const isAuthenticated = user !== null;
  const isAdmin = propIsAdmin ?? false;

  // Logout function - implement directly like in RecipeExtractor
  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        // Redirect to login page
        globalThis.location.href = "/auth/login";
      } else {
        console.error("Logout failed with status:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div class="flex gap-2">
        <a href="/auth/login" class="btn btn-primary btn-sm">
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div class="dropdown dropdown-end">
      <div tabIndex={0} role="button" class="btn btn-ghost btn-circle">
        <div class="w-8 h-8 bg-primary text-primary-content rounded-full flex items-center justify-center">
          <span class="text-xs font-medium leading-none">
            {user?.displayName?.charAt(0)?.toUpperCase() || "U"}
          </span>
        </div>
      </div>
      <ul
        tabIndex={0}
        class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
      >
        <li class="menu-title">
          <span class="text-sm text-base-content/70">
            {user?.email}
          </span>
        </li>
        <li>
          <hr class="my-1" />
        </li>
        <li>
          <a href="/profile">
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Profile
          </a>
        </li>
        {isAdmin && (
          <li>
            <a href="/admin">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Admin
            </a>
          </li>
        )}
        <li class="disabled">
          <span class="flex items-center gap-2">
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            Favorites (coming soon)
          </span>
        </li>
        <li class="disabled">
          <span class="flex items-center gap-2">
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
              />
            </svg>
            Inventory (coming soon)
          </span>
        </li>
        <li>
          <hr class="my-1" />
        </li>
        <li>
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              await logout();
            }}
            class="text-error flex items-center gap-2"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </li>
      </ul>
    </div>
  );
}
