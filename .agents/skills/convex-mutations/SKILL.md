---
name: convex-mutations
description: Create and optimize Convex mutation functions, including data updates, inserts, deletes, and transactional logic. Use when implementing write operations in Convex, handling form submissions, processing user actions that modify data, or optimizing mutation performance and consistency.
---

# Convex Mutations

Create and optimize Convex mutation functions.

## Follow This Workflow

1. Analyze the mutation operation:
   - what data needs to be changed
   - what validation is required
   - what side effects are needed
2. Check schema and indexes in `convex/schema.ts`:
   - confirm table structure
   - verify related indexes exist
3. Implement mutation in `convex/[feature].ts`:
   - use `mutation` from `./_generated/server`
   - validate args with `v.*`
   - keep operations atomic and focused
4. Handle dependencies:
   - verify referenced documents exist
   - maintain data consistency across related updates
5. Add robust error handling:
   - throw clear user-safe errors
   - prevent partial invalid states
6. Test mutation behavior:
   - success path
   - validation failures
   - missing data and edge cases

## Mutation Patterns

### Create

- Validate required fields.
- Set defaults for optional fields.
- Add timestamps (`createdAt`, `updatedAt`) when useful.

### Update

- Fetch and verify target document first.
- Update only intended fields.
- Refresh `updatedAt`.
- Preserve immutable fields.

### Delete

- Validate target exists.
- Handle related data cleanup or soft-delete strategy.
- Consider referential integrity for dependent records.

## Data Consistency Rules

- Keep each mutation focused on one clear business operation.
- Perform related writes in the same mutation when consistency is required.
- Validate ownership/authorization before write operations.
- Avoid hidden side effects unrelated to mutation purpose.

## Performance Rules

- Minimize read-before-write queries.
- Use indexes for lookups before updates/deletes.
- Avoid large loops inside a single mutation when batching is possible.
- Keep mutation work bounded and predictable.

## Error Handling Rules

- Throw clear and actionable errors.
- Do not leak sensitive internal details in error text.
- Validate early before expensive reads or writes.
- Guard against race-prone assumptions where relevant.

## Reference

Read `references/mutation-guidelines.md` for concrete examples and review checklists.
