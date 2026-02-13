import {
  IMPORT_JOB_NOT_FOUND_ERROR,
  IMPORT_SERVICE_UNAVAILABLE_ERROR,
  INVALID_IMPORT_JOB_ID_ERROR,
} from "../../../../contracts/imports.ts";
import type { GenericId } from "convex/values";
import { api } from "../../../../convex/api.ts";

type ImportJobResult = {
  jobId: string;
  sourceUrl: string;
  status: string;
};

type Params = {
  jobId: string;
};

type RouteContext = {
  params: Params | Promise<Params>;
};

let getImportJob: (jobId: string) => Promise<ImportJobResult | null> =
  defaultGetImportJob;

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const params = await context.params;
  const jobId = params?.jobId?.trim() ?? "";

  if (!isValidImportJobId(jobId)) {
    return Response.json(
      {
        error: INVALID_IMPORT_JOB_ID_ERROR,
      },
      { status: 400 },
    );
  }

  try {
    const job = await getImportJob(jobId);
    if (!job) {
      return Response.json(
        {
          error: IMPORT_JOB_NOT_FOUND_ERROR,
        },
        { status: 404 },
      );
    }

    return Response.json(job, { status: 200 });
  } catch {
    return Response.json(
      {
        error: IMPORT_SERVICE_UNAVAILABLE_ERROR,
      },
      { status: 503 },
    );
  }
}

function isValidImportJobId(jobId: string): boolean {
  return /^[a-z0-9]+$/.test(jobId);
}

export function setGetImportJobForTests(
  fn: ((jobId: string) => Promise<ImportJobResult | null>) | null,
): void {
  getImportJob = fn ?? defaultGetImportJob;
}

async function defaultGetImportJob(
  jobId: string,
): Promise<ImportJobResult | null> {
  const { getConvexServerClient } = await import(
    "../../../../convex/server.ts"
  );
  return getConvexServerClient().query(
    api.importJobs.getImportJob,
    { jobId: jobId as GenericId<"importJobs"> },
  );
}
