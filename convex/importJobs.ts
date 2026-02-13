import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

const IMPORT_JOB_QUEUED_STATUS = "queued";

export const createImportJob = mutationGeneric({
  args: {
    sourceUrl: v.string(),
  },
  returns: v.object({
    jobId: v.string(),
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
