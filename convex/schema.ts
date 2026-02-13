import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  importJobs: defineTable({
    sourceUrl: v.string(),
    status: v.string(),
    failureReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),
});
