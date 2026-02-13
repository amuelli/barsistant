import type { FunctionReturnType } from "convex/server";
import type { GenericId } from "convex/values";
import { api } from "../../../convex/api.ts";
import { setCreateImportJobForTests } from "./route.ts";

type CreateImportJobResult = FunctionReturnType<
  typeof api.importJobs.createImportJob
>;
type CreateImportJobFn = Exclude<
  Parameters<typeof setCreateImportJobForTests>[0],
  null
>;
type CreateImportJobSourceUrl = Parameters<CreateImportJobFn>[0];
type CreateImportJobSeamResult = Awaited<ReturnType<CreateImportJobFn>>;

declare const sourceUrl: CreateImportJobSourceUrl;
const acceptsSourceUrlString: string = sourceUrl;
void acceptsSourceUrlString;

declare const seamResult: CreateImportJobSeamResult;
const seamJobId: CreateImportJobResult["jobId"] = seamResult.jobId;
void seamJobId;

const typedJobId = "" as GenericId<"importJobs">;
const acceptsTypedJobId: CreateImportJobResult["jobId"] = typedJobId;
void acceptsTypedJobId;

// @ts-expect-error import route submit contract must keep Convex importJobs id typing.
const rejectsPlainStringJobId: CreateImportJobResult["jobId"] = "job123";
void rejectsPlainStringJobId;
