import type { FunctionReturnType } from "convex/server";
import type { GenericId } from "convex/values";
import { api } from "../convex/api.ts";
import {
  setReadImportJobStatusForTests,
  submitImportUrl,
} from "./import_url_form.tsx";

type CreateImportJobResult = FunctionReturnType<
  typeof api.importJobs.createImportJob
>;
type ReadImportJobStatusResult = FunctionReturnType<
  typeof api.importJobs.getImportJob
>;
type SubmitImportOutcome = Awaited<ReturnType<typeof submitImportUrl>>;

declare const createdJob: CreateImportJobResult;
const createdJobId: GenericId<"importJobs"> = createdJob.jobId;
void createdJobId;

declare const readback: ReadImportJobStatusResult;
if (readback) {
  const readbackJobId: CreateImportJobResult["jobId"] = readback.jobId;
  void readbackJobId;
}

declare const outcome: SubmitImportOutcome;
if (outcome.result) {
  const outcomeJobId: CreateImportJobResult["jobId"] = outcome.result.jobId;
  void outcomeJobId;
}

type ReadStatusFn = Exclude<
  Parameters<typeof setReadImportJobStatusForTests>[0],
  null
>;
type ReadStatusJobId = Parameters<ReadStatusFn>[0];

const typedReadStatusJobId = "" as GenericId<"importJobs">;
const acceptsReadStatusJobId: ReadStatusJobId = typedReadStatusJobId;
void acceptsReadStatusJobId;

// @ts-expect-error readback seam must require a typed importJobs id.
const rejectsPlainStringJobId: ReadStatusJobId = "job123";
void rejectsPlainStringJobId;
