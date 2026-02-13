import { api as runtimeApi } from "../../convex/_generated/api.js";
import type * as importJobs from "../../convex/importJobs.ts";
import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

type PublicApi = FilterApi<
  ApiFromModules<{
    importJobs: typeof importJobs;
  }>,
  FunctionReference<
    "query" | "mutation" | "action",
    "public",
    Record<string, unknown>,
    unknown
  >
>;

export const api = runtimeApi as unknown as PublicApi;
