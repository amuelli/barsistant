import { ConvexHttpClient } from "convex/browser";
import { getRequiredConvexUrl } from "../config/convex.ts";

let client: ConvexHttpClient | null = null;

export function getConvexServerClient(): ConvexHttpClient {
  if (client !== null) {
    return client;
  }

  client = new ConvexHttpClient(getRequiredConvexUrl());
  return client;
}

export function resetConvexServerClientForTests(): void {
  client = null;
}
