/// <reference lib="deno.ns" />
import { assertEquals } from "jsr:@std/assert";
import type { GenericId } from "convex/values";
import { createImportJob, getImportJob } from "./importJobs.ts";

const TEST_JOB_ID = "job123" as GenericId<"importJobs">;
const createImportJobHandler = (
  createImportJob as unknown as {
    _handler: (
      ctx: unknown,
      args: { sourceUrl: string },
    ) => Promise<{
      jobId: GenericId<"importJobs">;
      sourceUrl: string;
      status: string;
    }>;
  }
)._handler;
const getImportJobHandler = (
  getImportJob as unknown as {
    _handler: (
      ctx: unknown,
      args: { jobId: GenericId<"importJobs"> },
    ) => Promise<{
      jobId: GenericId<"importJobs">;
      sourceUrl: string;
      status: string;
    } | null>;
  }
)._handler;

Deno.test("createImportJob persists a queued import job and returns its contract", async () => {
  const insertedRows: Array<{
    table: string;
    value: {
      sourceUrl: string;
      status: string;
      createdAt: number;
      updatedAt: number;
    };
  }> = [];

  const result = await createImportJobHandler(
    {
      db: {
        insert: async (
          table: string,
          value: {
            sourceUrl: string;
            status: string;
            createdAt: number;
            updatedAt: number;
          },
        ) => {
          insertedRows.push({ table, value });
          return TEST_JOB_ID;
        },
      },
    } as never,
    { sourceUrl: "https://www.liquor.com/recipes/negroni/" },
  );

  assertEquals(result, {
    jobId: TEST_JOB_ID,
    sourceUrl: "https://www.liquor.com/recipes/negroni/",
    status: "queued",
  });
  assertEquals(insertedRows.length, 1);
  assertEquals(insertedRows[0].table, "importJobs");
  assertEquals(insertedRows[0].value.sourceUrl, "https://www.liquor.com/recipes/negroni/");
  assertEquals(insertedRows[0].value.status, "queued");
  assertEquals(typeof insertedRows[0].value.createdAt, "number");
  assertEquals(typeof insertedRows[0].value.updatedAt, "number");
  assertEquals(insertedRows[0].value.createdAt, insertedRows[0].value.updatedAt);
});

Deno.test("getImportJob returns null when the job is missing", async () => {
  const result = await getImportJobHandler(
    {
      db: {
        get: async () => null,
      },
    } as never,
    { jobId: TEST_JOB_ID },
  );

  assertEquals(result, null);
});

Deno.test("getImportJob returns the persisted queued job contract", async () => {
  const result = await getImportJobHandler(
    {
      db: {
        get: async (jobId: GenericId<"importJobs">) => ({
          _id: jobId,
          sourceUrl: "https://www.diffordsguide.com/cocktails/recipe/1234/negroni",
          status: "queued",
        }),
      },
    } as never,
    { jobId: TEST_JOB_ID },
  );

  assertEquals(result, {
    jobId: TEST_JOB_ID,
    sourceUrl: "https://www.diffordsguide.com/cocktails/recipe/1234/negroni",
    status: "queued",
  });
});
