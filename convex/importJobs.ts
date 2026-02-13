import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const IMPORT_JOB_QUEUED_STATUS = "queued";

export const createImportJob = mutationGeneric({
  args: {
    sourceUrl: v.string(),
  },
  returns: v.object({
    jobId: v.id("importJobs"),
    sourceUrl: v.string(),
    status: v.string(),
  }),
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const jobId = await ctx.db.insert("importJobs", {
      sourceUrl: args.sourceUrl,
      status: IMPORT_JOB_QUEUED_STATUS,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return {
      jobId,
      sourceUrl: args.sourceUrl,
      status: IMPORT_JOB_QUEUED_STATUS,
    };
  },
});

export const getImportJob = queryGeneric({
  args: {
    jobId: v.id("importJobs"),
  },
  returns: v.union(
    v.object({
      jobId: v.id("importJobs"),
      sourceUrl: v.string(),
      status: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      return null;
    }

    return {
      jobId: job._id,
      sourceUrl: job.sourceUrl,
      status: job.status,
    };
  },
});
