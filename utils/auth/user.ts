import { User, UserPreferences } from "../../types/user.ts";
import { kv, type UserEmailKey, type UserKey } from "../db/db.ts";

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  return crypto.randomUUID();
}

/**
 * Create default user preferences
 */
export function createDefaultUserPreferences(): UserPreferences {
  return {
    theme: "system",
    preferredMeasurementUnit: "imperial",
  };
}

/**
 * Find a user by email address
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const userEmailKey: UserEmailKey = ["user_emails", email];
  const result = await kv.get<string>(userEmailKey);

  if (!result.value) {
    return null;
  }

  const userId = result.value;
  const userKey: UserKey = ["users", userId];
  const userResult = await kv.get<User>(userKey);

  return userResult.value || null;
}

/**
 * Find a user by ID
 */
export async function findUserById(userId: string): Promise<User | null> {
  const userKey: UserKey = ["users", userId];
  const result = await kv.get<User>(userKey);
  return result.value || null;
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  displayName?: string,
): Promise<User> {
  const userId = generateUserId();
  const now = new Date().toISOString();

  const user: User = {
    id: userId,
    email,
    displayName: displayName || email.split("@")[0],
    preferences: createDefaultUserPreferences(),
    createdAt: now,
    updatedAt: now,
  };

  // Use atomic transaction to ensure both user and email lookup are created together
  const userKey: UserKey = ["users", userId];
  const userEmailKey: UserEmailKey = ["user_emails", email];
  const atomicOp = kv.atomic()
    .set(userKey, user)
    .set(userEmailKey, userId);

  const result = await atomicOp.commit();

  if (!result.ok) {
    throw new Error("Failed to create user");
  }

  return user;
}

/**
 * Update a user's last login timestamp
 */
export async function updateUserLastLogin(userId: string): Promise<void> {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  user.lastLoginAt = new Date().toISOString();
  user.updatedAt = new Date().toISOString();

  const userKey: UserKey = ["users", userId];
  await kv.set(userKey, user);
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>,
): Promise<User> {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  user.preferences = { ...user.preferences, ...preferences };
  user.updatedAt = new Date().toISOString();

  const userKey: UserKey = ["users", userId];
  await kv.set(userKey, user);

  return user;
}

/**
 * Delete a user and all associated data
 */
export async function deleteUser(userId: string): Promise<void> {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Use atomic transaction to remove user and email lookup
  const userKey: UserKey = ["users", userId];
  const userEmailKey: UserEmailKey = ["user_emails", user.email];
  const atomicOp = kv.atomic()
    .delete(userKey)
    .delete(userEmailKey);

  const result = await atomicOp.commit();

  if (!result.ok) {
    throw new Error("Failed to delete user");
  }
}
