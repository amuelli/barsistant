# Mutation Guidelines

Use this reference when implementing or reviewing Convex mutations.

## 1) Design the Mutation Contract First

Define:
- exact input shape
- expected output shape
- allowed caller roles
- side effects

Keep the contract small and explicit.

## 2) Validate Arguments Rigorously

- Use `v.*` validators for all public mutation args.
- Reject malformed payloads early.
- Normalize optional values before writes.

## 3) Verify Target State Before Updates

For updates/deletes:
- load the target document
- fail with a clear error if missing
- confirm caller permission/ownership

## 4) Keep Writes Atomic and Intentional

Group related writes that must stay consistent inside one mutation.
Do not spread a single business operation across unrelated mutations.

## 5) Protect Immutable Fields

Do not overwrite fields such as:
- `createdAt`
- creator/owner ids
- system-generated identifiers

Use explicit patch objects rather than forwarding raw user payloads.

## 6) Handle Deletes Safely

Choose strategy per table:
- hard delete for ephemeral data
- soft delete for audit/recovery needs

If a record is referenced elsewhere, clean up dependents or prevent delete.

## 7) Avoid Expensive Mutation Work

- avoid large in-mutation loops
- avoid broad scans before writes
- use index-based lookups whenever possible

If work is large, split into smaller operations or a background workflow.

## 8) Return Minimal Useful Data

Return only what the caller needs:
- updated id
- status/result
- small summary fields

Avoid returning large documents unless required.

## 9) Test Mutation Behavior

Cover at minimum:
- valid success path
- invalid argument rejection
- missing document handling
- authorization/ownership failure
- boundary values

## 10) Review Checklist

Before shipping, confirm:
- args are validated
- lookup paths use indexes
- authorization checks happen before writes
- immutable fields are protected
- errors are clear and safe
- tests cover core and failure paths
