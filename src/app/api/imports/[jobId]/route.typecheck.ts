import type { FunctionReturnType } from "convex/server";
import { api } from "../../../../convex/api.ts";
import { setGetImportJobForTests } from "./route.ts";

type GetImportJobResult = FunctionReturnType<
  typeof api.importJobs.getImportJob
>;
type GetImportJobFn = Exclude<
  Parameters<typeof setGetImportJobForTests>[0],
  null
>;
type GetImportJobParam = Parameters<GetImportJobFn>[0];
type GetImportJobSeamResult = Awaited<ReturnType<GetImportJobFn>>;
type ImportJobResult = Exclude<GetImportJobResult, null>;

const acceptsStringJobId: GetImportJobParam = "job123";
void acceptsStringJobId;

const acceptsNullResult: GetImportJobSeamResult = null;
void acceptsNullResult;

declare const seamResult: Exclude<GetImportJobSeamResult, null>;
const seamJobId: ImportJobResult["jobId"] = seamResult.jobId;
void seamJobId;
