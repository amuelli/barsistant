# Query Guidelines

Use these rules when building or reviewing Convex queries.

## 1) Start With Query Shape

Define:
- Required equality constraints
- Optional range constraints
- Required sort order

Design the index to match that exact shape.

## 2) Prefer `.withIndex()` for Scale

Use `.withIndex()` for production reads.
Use `.filter()` only when data is known to stay small or when prototyping.

## 3) Build Compound Indexes in Constraint Order

Order fields as:
1. equality fields
2. range/sort fields

Example:
- Query: `where orgId = ? and status = ? order by createdAt`
- Index: `["orgId", "status", "createdAt"]`

## 4) Put Selective Fields First

A field with many repeated values is low-selectivity.
A field with many distinct values is high-selectivity.

Place higher-selectivity equality fields earlier when possible.

## 5) Keep Access Paths Focused

Avoid "one index for everything."
Create a separate index when a new query shape becomes important.

## 6) Avoid Unbounded Reads

- Use tight index ranges.
- Use limits or pagination for large result sets.
- Return only what callers need.

## 7) Validate With Realistic Data

Before shipping:
- Test empty, small, and larger datasets.
- Confirm query behavior is stable with expected growth.
- Confirm no accidental full scans were introduced.
