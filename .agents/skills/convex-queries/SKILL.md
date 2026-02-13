---
name: convex-queries
description: Write and review Convex query functions with index-first patterns, scalable filtering, and predictable performance. Use when adding new Convex reads, debugging slow or incorrect queries, designing indexes, or refactoring `.filter()` usage into `.withIndex()` lookups.
---

# Convex Queries

Use this skill to implement Convex query functions that stay fast as data grows.

## Follow This Workflow

1. Inspect `convex/schema.ts` first.
2. Define the query shape (required equality filters, optional range filters, and order).
3. Prefer `.withIndex()` over `.filter()` for primary access paths.
4. Match index field order to query constraints:
   - equality fields first
   - then range or sort fields
5. Keep the query narrow and deterministic (avoid broad scans).
6. Add or update indexes when query shape changes.

## Query Design Rules

- Use `.filter()` only for small datasets, temporary migrations, or non-critical paths.
- Put high-selectivity fields early in compound indexes.
- Keep one stable query shape per index.
- If you need ordering by a field, include that field in the index.
- For user-scoped data, start indexes with user/team/tenant id.

## Implementation Checklist

- Query args are validated and minimal.
- Access path uses `.withIndex()` for production-facing reads.
- Index exists in `convex/schema.ts` and matches query shape.
- Query avoids unbounded scans and returns only needed documents.
- Tests cover normal, empty, and boundary cases.

## Reference

For deeper guidance and examples, read `references/query-guidelines.md`.
