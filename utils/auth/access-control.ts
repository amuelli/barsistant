/// <reference lib="deno.unstable" />

/**
 * Centralized Access Control Service for Barsistant
 *
 * This service provides a single source of truth for all permission checks
 * across the application, ensuring consistent security policies.
 */

import { recipeModel, type SearchRecipeParams } from "🛠️/db/recipe-model.ts";
import { checkAdminFromUser } from "🛠️/auth/admin.ts";
import { User } from "../../types/user.ts";

export interface AccessContext {
  user: User | null;
  userAgent?: string;
  ip?: string;
}

export class AccessControlError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "AccessControlError";
  }
}

/**
 * Centralized Access Control Service
 */
export class AccessControlService {
  /**
   * Recipe Access Control
   */

  /**
   * Check if a user can view a specific recipe
   */
  async canViewRecipe(
    recipeId: string,
    context: AccessContext,
  ): Promise<boolean> {
    try {
      // Admin can view any recipe
      if (context.user && this.isAdmin(context.user)) {
        return true;
      }

      // Use existing secure access check
      return await recipeModel.canUserAccessRecipe(
        recipeId,
        context.user?.id || null,
      );
    } catch (error) {
      console.error(`Access check failed for recipe ${recipeId}:`, error);
      return false;
    }
  }

  /**
   * Check if a user can edit a specific recipe
   */
  async canEditRecipe(
    recipeId: string,
    context: AccessContext,
  ): Promise<boolean> {
    if (!context.user) {
      return false;
    }

    try {
      // Admin can edit any recipe
      if (this.isAdmin(context.user)) {
        return true;
      }

      // User can edit their own recipes
      const recipe = await recipeModel.getUserRecipeById(
        context.user.id,
        recipeId,
      );
      return recipe !== null && recipe.createdBy === context.user.id;
    } catch (error) {
      console.error(`Edit access check failed for recipe ${recipeId}:`, error);
      return false;
    }
  }

  /**
   * Check if a user can delete a specific recipe
   */
  async canDeleteRecipe(
    recipeId: string,
    context: AccessContext,
  ): Promise<boolean> {
    if (!context.user) {
      return false;
    }

    try {
      // Admin can delete any recipe
      if (this.isAdmin(context.user)) {
        return true;
      }

      // User can delete their own recipes
      const recipe = await recipeModel.getUserRecipeById(
        context.user.id,
        recipeId,
      );
      return recipe !== null && recipe.createdBy === context.user.id;
    } catch (error) {
      console.error(
        `Delete access check failed for recipe ${recipeId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Check if a user can change recipe visibility
   */
  async canChangeRecipeVisibility(
    recipeId: string,
    context: AccessContext,
  ): Promise<boolean> {
    if (!context.user) {
      return false;
    }

    try {
      // Admin can change any recipe visibility
      if (this.isAdmin(context.user)) {
        return true;
      }

      // User can change visibility of their own recipes
      const recipe = await recipeModel.getUserRecipeById(
        context.user.id,
        recipeId,
      );
      return recipe !== null && recipe.createdBy === context.user.id;
    } catch (error) {
      console.error(
        `Visibility access check failed for recipe ${recipeId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Admin Access Control
   */

  /**
   * Check if a user is an admin
   */
  isAdmin(user: User): boolean {
    try {
      return checkAdminFromUser(user);
    } catch (error) {
      console.error(`Admin check failed for user ${user.id}:`, error);
      return false;
    }
  }

  /**
   * Require admin access (throws if not admin)
   */
  requireAdmin(context: AccessContext): void {
    if (!context.user) {
      throw new AccessControlError("Authentication required", "UNAUTHORIZED");
    }

    if (!this.isAdmin(context.user)) {
      throw new AccessControlError("Admin access required", "FORBIDDEN");
    }
  }

  /**
   * Collection Access Control
   */

  /**
   * Check if a user can manage another user's collection
   */
  canManageUserCollection(
    targetUserId: string,
    context: AccessContext,
  ): boolean {
    if (!context.user) {
      return false;
    }

    try {
      // Admin can manage any collection
      if (this.isAdmin(context.user)) {
        return true;
      }

      // User can manage their own collection
      return context.user.id === targetUserId;
    } catch (error) {
      console.error(
        `Collection access check failed for user ${targetUserId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Authentication Helpers
   */

  /**
   * Require authentication (throws if not authenticated)
   */
  requireAuth(context: AccessContext): User {
    if (!context.user) {
      throw new AccessControlError("Authentication required", "UNAUTHORIZED");
    }
    return context.user;
  }

  /**
   * Require recipe access (throws if no access)
   */
  async requireRecipeAccess(
    recipeId: string,
    context: AccessContext,
  ): Promise<void> {
    const canAccess = await this.canViewRecipe(recipeId, context);
    if (!canAccess) {
      throw new AccessControlError(
        "Recipe not found or access denied",
        "NOT_FOUND",
      );
    }
  }

  /**
   * Require recipe edit access (throws if no edit access)
   */
  async requireRecipeEditAccess(
    recipeId: string,
    context: AccessContext,
  ): Promise<void> {
    const canEdit = await this.canEditRecipe(recipeId, context);
    if (!canEdit) {
      throw new AccessControlError(
        "Not authorized to edit this recipe",
        "FORBIDDEN",
      );
    }
  }

  /**
   * Search Access Control
   */

  /**
   * Get appropriate search method based on user context
   */
  getSearchMethod(context: AccessContext) {
    if (context.user) {
      // Authenticated users can search their accessible recipes
      return (params: SearchRecipeParams) =>
        recipeModel.searchUserAccessibleRecipes(context.user!.id, params);
    } else {
      // Unauthenticated users only see public recipes
      return (params: SearchRecipeParams) =>
        recipeModel.searchPublicRecipes(params);
    }
  }

  /**
   * Get appropriate listing method based on user context
   */
  getListMethod(context: AccessContext) {
    if (context.user) {
      // Authenticated users get their collection (handled by collection model)
      return null; // Use userCollectionModel.getUserCollection instead
    } else {
      // Unauthenticated users see public recipes
      return (limit?: number) => recipeModel.listPublicRecipes(limit);
    }
  }
}

// Singleton instance for use across the application
export const accessControl = new AccessControlService();

/**
 * Utility function to create access context from Fresh context
 */
export function createAccessContext(
  ctx: { state: { user: User | null }; req: Request },
): AccessContext {
  return {
    user: ctx.state.user,
    userAgent: ctx.req.headers.get("User-Agent") || undefined,
    ip: ctx.req.headers.get("X-Forwarded-For") ||
      ctx.req.headers.get("X-Real-IP") ||
      "unknown",
  };
}
