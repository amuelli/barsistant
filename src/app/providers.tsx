"use client";

import { ConvexProvider } from "convex/react";
import type { ReactNode } from "react";
import { getConvexClient } from "../convex/client.ts";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return <ConvexProvider client={getConvexClient()}>{children}</ConvexProvider>;
}
