/**
 * Test helper utilities for creating mock requests and responses
 */

import type { FreshContext } from "fresh";

/**
 * Create a mock Request object for testing
 * @param method HTTP method
 * @param url Request URL
 * @param body Request body (will be JSON stringified)
 * @param headers Additional headers
 * @returns Mock Request object
 */
export function createMockRequest(
  method: string,
  url: string,
  body?: unknown,
  headers?: Record<string, string>,
): Request {
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body !== null && body !== undefined) {
    init.body = JSON.stringify(body);
  }

  return new Request(`http://localhost${url}`, init);
}

/**
 * Create a mock FreshContext for testing handlers
 * @param req Request object
 * @param params URL parameters
 * @param state Context state
 * @returns Mock FreshContext
 */
export function createMockContext(
  req: Request,
  params: Record<string, string> = {},
  state: Record<string, unknown> = {},
): Partial<FreshContext> {
  return {
    req,
    params,
    state,
    render: (_component: unknown) =>
      Promise.resolve(new Response("Mock render")),
  };
}
