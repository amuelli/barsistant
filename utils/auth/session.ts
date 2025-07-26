import { UserSession } from "../../types/user.ts";
import {
  kv,
  type UserSessionKey,
  type UserSessionLookupKey,
} from "../db/db.ts";

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Create a new user session
 */
export async function createUserSession(
  userId: string,
  email: string,
  sessionDurationDays: number = 30,
): Promise<UserSession> {
  const sessionId = generateSessionId();
  const now = new Date();
  const expires = new Date(
    now.getTime() + sessionDurationDays * 24 * 60 * 60 * 1000,
  );

  const session: UserSession = {
    id: sessionId,
    userId,
    email,
    created: now.toISOString(),
    expires: expires.toISOString(),
    lastActive: now.toISOString(),
  };

  // Use atomic transaction to create session and user lookup
  const userSessionKey: UserSessionKey = ["user_sessions", sessionId];
  const userSessionLookupKey: UserSessionLookupKey = [
    "user_session_lookup",
    userId,
    sessionId,
  ];
  const atomicOp = kv.atomic()
    .set(userSessionKey, session, {
      expireIn: sessionDurationDays * 24 * 60 * 60 * 1000,
    })
    .set(userSessionLookupKey, true, {
      expireIn: sessionDurationDays * 24 * 60 * 60 * 1000,
    });

  const result = await atomicOp.commit();

  if (!result.ok) {
    throw new Error("Failed to create session");
  }

  return session;
}

/**
 * Get a user session by session ID
 */
export async function getUserSession(
  sessionId: string,
): Promise<UserSession | null> {
  const userSessionKey: UserSessionKey = ["user_sessions", sessionId];
  const result = await kv.get<UserSession>(userSessionKey);

  if (!result.value) {
    return null;
  }

  const session = result.value;

  // Check if session is expired
  if (new Date() > new Date(session.expires)) {
    await deleteUserSession(sessionId);
    return null;
  }

  return session;
}

/**
 * Update session last active timestamp
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  const session = await getUserSession(sessionId);

  if (!session) {
    return;
  }

  session.lastActive = new Date().toISOString();
  const userSessionKey: UserSessionKey = ["user_sessions", sessionId];
  await kv.set(userSessionKey, session);
}

/**
 * Delete a user session
 */
export async function deleteUserSession(sessionId: string): Promise<void> {
  const session = await getUserSession(sessionId);

  if (!session) {
    return;
  }

  // Use atomic transaction to remove session and user lookup
  const userSessionKey: UserSessionKey = ["user_sessions", sessionId];
  const userSessionLookupKey: UserSessionLookupKey = [
    "user_session_lookup",
    session.userId,
    sessionId,
  ];
  const atomicOp = kv.atomic()
    .delete(userSessionKey)
    .delete(userSessionLookupKey);

  await atomicOp.commit();
}

/**
 * Delete all sessions for a user
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  const iterator = kv.list<boolean>({
    prefix: ["user_session_lookup", userId],
  });

  for await (const entry of iterator) {
    const sessionId = entry.key[2] as string;
    await deleteUserSession(sessionId);
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<UserSession[]> {
  const sessions: UserSession[] = [];
  const iterator = kv.list<boolean>({
    prefix: ["user_session_lookup", userId],
  });

  for await (const entry of iterator) {
    const sessionId = entry.key[2] as string;
    const session = await getUserSession(sessionId);

    if (session) {
      sessions.push(session);
    }
  }

  return sessions;
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const now = new Date();
  const iterator = kv.list<UserSession>({ prefix: ["user_sessions"] });

  for await (const entry of iterator) {
    const session = entry.value;
    if (new Date(session.expires) < now) {
      await deleteUserSession(session.id);
    }
  }
}
