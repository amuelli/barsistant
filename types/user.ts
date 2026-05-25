/**
 * User type definitions for the Barsistant application
 *
 * These types define the structure of user data, preferences, and authentication
 * as stored in the Deno KV database.
 */

/**
 * Represents a user in the system
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  preferences: UserPreferences;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  lastLoginAt?: string; // ISO date string
}

/**
 * Represents a user's preferences
 */
export interface UserPreferences {
  theme: "light" | "dark" | "system";
  preferredMeasurementUnit: "oz" | "ml";
}

/**
 * Represents a user's favorite recipe
 */
export interface UserFavorite {
  userId: string;
  recipeId: string;
  addedAt: string; // ISO date string
  notes?: string;
}

/**
 * Represents a user's personal note on a recipe
 */
export interface UserNote {
  userId: string;
  recipeId: string;
  note: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Represents a user's inventory item
 */
export interface UserInventoryItem {
  userId: string;
  ingredientId: string;
  quantity?: number;
  unit?: string;
  inStock: boolean;
  addedAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Represents an authentication token for magic link auth
 */
export interface MagicLinkToken {
  token: string;
  email: string;
  verificationCode: string; // 8-digit code (format: 1234-5678)
  userId?: string; // For returning users
  expires: string; // ISO date string
  used: boolean; // To prevent token reuse
}

/**
 * Represents a user session
 */
export interface UserSession {
  id: string;
  userId: string;
  email: string;
  created: string; // ISO date string
  expires: string; // ISO date string
}
