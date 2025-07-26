import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { User } from "../types/user.ts";
import { AuthContext } from "🛠️/auth/context.ts";

interface AuthProviderProps {
  children: preact.ComponentChildren;
  initialUser?: User | null;
}

export default function AuthProvider(
  { children, initialUser = null }: AuthProviderProps,
) {
  const user = useSignal<User | null>(initialUser);
  const loading = useSignal(false);

  const refresh = async () => {
    if (loading.value) return;

    loading.value = true;
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          user.value = data.user;
        } else {
          user.value = null;
        }
      } else {
        user.value = null;
      }
    } catch (error) {
      console.error("Error refreshing auth:", error);
      user.value = null;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    if (loading.value) return;

    loading.value = true;
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        user.value = null;
        // Redirect to login page
        globalThis.location.href = "/auth/login";
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      loading.value = false;
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    if (!initialUser) {
      refresh();
    } else {
      // Initial user present, skipping refresh
    }
  }, []);

  const contextValue = {
    user: user.value,
    isAuthenticated: user.value !== null,
    logout,
    refresh,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
