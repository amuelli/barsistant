import { ConvexReactClient } from "convex/react";
import { getRequiredConvexUrl } from "../config/convex.ts";

let client: ConvexReactClient | null = null;

export function getConvexClient(): ConvexReactClient {
  if (client !== null) {
    return client;
  }

  client = new ConvexReactClient(getRequiredConvexUrl());
  return client;
}

export function resetConvexClientForTests(): void {
  client = null;
}
