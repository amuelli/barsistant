import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { User } from "../../types/user.ts";

export interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContext>({
  user: null,
  isAuthenticated: false,
  logout: async () => {},
  refresh: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
