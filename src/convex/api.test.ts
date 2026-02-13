/// <reference lib="deno.ns" />
import { assertExists } from "jsr:@std/assert";
import { api } from "./api.ts";

Deno.test("convex api bridge exposes import job query and mutation references", () => {
  assertExists(api.importJobs.createImportJob);
  assertExists(api.importJobs.getImportJob);
});
