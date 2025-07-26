# PRD: Deno KV Data Structure Refactoring

## Document Information

- **Document Type**: Product Requirements Document
- **Version**: 0.1.0 (Draft)
- **Created**: 2025-07-26
- **Status**: Draft - Awaiting Requirements

## Executive Summary

This PRD outlines the requirements for refactoring the current Deno KV data
structure in Barsistant to improve performance, maintainability, and
scalability.

## Product Context

### Core Product Requirements

**Recipe Management**:

- Users can create new cocktail recipes
- Users can update their existing recipes
- Users can view their own recipes
- Recipes are private by default (only visible to the creator)
- Users can optionally make recipes public for community sharing
- Public recipes can be browsed separately from personal recipes
- Users can copy public recipes into their own personal collection
- When copying a recipe, the system tracks the original source recipe for
  attribution

**User Experience**:

- Private recipes provide a personal recipe collection
- Public recipes enable community discovery and sharing through a separate
  browsing interface
- Clear privacy controls for recipe visibility
- Seamless copying mechanism to save public recipes to personal collection
- Recipe provenance tracking maintains connection to original creators

## Current State Analysis

### Existing Key Patterns

Based on current implementation in `utils/db/db.ts`:

```typescript
// Primary entities
["recipe", recipeId] → Recipe
["ingredient", ingredientId] → Ingredient
["user", userId] → User

// Relationships
["recipe_ingredient", recipeId, ingredientId] → RecipeIngredient
["user_favorites", userId, recipeId] → UserFavorite
["user_inventory", userId, ingredientId] → UserInventoryItem

// Authentication
["auth_tokens", token] → MagicLinkToken
["user_sessions", sessionId] → UserSession
["user_emails", email] → userId

// Secondary indexes
["ingredient_recipes", ingredientId, recipeId] → RecipeReference
["tag_recipes", tag, recipeId] → RecipeReference
```

### Current Pain Points

**Performance Issues**:

- Loading user's recipe collection takes longer than necessary
- Current implementation may be using inefficient query patterns or N+1
  operations
- User experience degraded by slow collection loading times
- Non-negligible performance difference between using `kv.list()` vs multiple
  `kv.get()` calls
- Current architecture may favor multiple `kv.get()` operations when `kv.list()`
  would be more efficient

### Current State Notes

**ULID Already Implemented**: The project already uses ULIDs for entity IDs. The
key opportunity is leveraging ULID's embedded timestamp for efficient
chronological sorting in key patterns.

### Current Search Implementation

Based on analysis of the codebase, search functionality is implemented as
follows:

#### **Current Search Implementation**:

- Complex database-based search with multiple indexes
- Secondary indexes for tags, ingredients, users, public recipes
- Intersection logic for combining multiple filters
- Maintenance overhead for keeping indexes synchronized

#### **Proposed Search Simplification**:

- **Load entire collections** using efficient `kv.list()` operations
- **Filter in-memory** by recipe name only (case-insensitive)
- **No database indexes** required for search
- **Simple implementation**:
  `recipes.filter(r => r.name.toLowerCase().includes(query.toLowerCase()))`

## Goals and Objectives

### Primary Goals

- **Clear Data Separation**: Establish distinct separation between public
  recipes and user-owned recipes in the data structure
- **Performance Optimization**: Improve user collection loading performance by
  leveraging `kv.list()` over multiple `kv.get()` operations
- **Recipe Copying Model**: Enable seamless copying of public recipes to user
  collections while maintaining clear ownership boundaries
- **Chronological Sorting**: Leverage existing ULID timestamps in key patterns
  for efficient chronological sorting
- **Simplified Architecture**: Minimal data structure focusing on core
  functionality, with search optimization deferred until needed

### Success Metrics

- **Collection Load Time**: Reduce user recipe collection loading time by >50%
- **Query Efficiency**: Use `kv.list()` operations instead of multiple
  `kv.get()` calls for collection loading
- **Data Separation**: Clear architectural boundary between public and
  user-owned recipes
- **Sorting Performance**: Sub-second response times for chronologically sorted
  recipe lists
- **Search Simplicity**: Eliminate complex database search infrastructure

## Requirements

### Functional Requirements

- **User Recipe Collections**: Users can efficiently load and browse their
  personal recipe collections
- **Public Recipe Discovery**: Users can browse public recipes separately from
  personal collections
- **Recipe Copying**: Users can copy public recipes to their personal
  collections with source tracking
- **Chronological Sorting**: Both public and user recipes can be sorted by
  creation date
- **Privacy Controls**: Clear distinction between private and public recipe
  visibility
- **Simple Search**: Users can search recipes by name within loaded collections

### Non-Functional Requirements

- **Performance**: Collection loading must be optimized for `kv.list()`
  operations
- **Scalability**: Data structure must support growing numbers of users and
  recipes
- **Maintainability**: Clear separation of concerns between public and private
  data
- **Consistency**: ULID-based ordering for reliable chronological sorting

### Performance Requirements

- **Collection Load Time**: <500ms for typical user collections
- **Public Recipe Browse**: <1s for paginated public recipe listing
- **In-Memory Search**: <100ms for name-based filtering of loaded collections
- **Copy Operation**: <200ms for recipe copying with provenance tracking

## Proposed Changes

### New Data Structure

#### **Core Entities with ULID Keys**:

```typescript
// User-owned recipes (private by default)
["user_recipe", userId, ulid] → Recipe

// Public recipes (separate namespace)  
["public_recipe", ulid] → Recipe

// Users and authentication (unchanged)
["user", userId] → User
["user_sessions", sessionId] → UserSession
["auth_tokens", token] → MagicLinkToken
["user_emails", email] → userId

// Ingredients (unchanged)
["ingredient", ingredientId] → Ingredient
```

#### **Single Recipe Type Handles All Cases**:

```typescript
export interface Recipe {
  id: string;
  name: string;
  // ... existing fields (without strength/sweetness)
  createdBy?: string; // Who created the recipe
  visibility?: RecipeVisibility; // "private" | "public"
  originalRecipeId?: string; // Source recipe if copied from another recipe
  publicRecipeId?: string; // Public recipe ID if this private recipe was made public
  // ... rest of existing fields
}
```

#### **Simplified Structure** (No Search Indexes):

```typescript
// Core entities only - no separate ingredient relationships or search indexes
// All search will be done by loading recipes and filtering in application code
// This keeps the data structure minimal and can be optimized later if needed

// Ingredients (unchanged)
["ingredient", ingredientId] → Ingredient
```

#### **Key Benefits**:

- **Chronological ordering**: ULIDs in key patterns enable natural sorting by
  creation time
- **Namespace separation**: Clear distinction between user and public recipes
- **Efficient listing**: `kv.list({ prefix: ["user_recipe", userId] })` for user
  collections
- **Copy tracking**: `originalRecipeId` field tracks recipe provenance
- **Minimal complexity**: No search indexes to maintain or keep in sync
- **Atomic operations**: Recipe updates don't require coordinating multiple keys
- **Simple search**: Name-based filtering within loaded collections

### Migration Strategy

- **Clean Slate Approach**: Database will be wiped before implementing changes
- **No Data Migration Required**: Existing data does not need to be preserved or
  migrated
- **Fresh Implementation**: Can implement optimal data structure without
  backward compatibility constraints

## Implementation Plan

### Phase 1: Simplification (Reduce Complexity First)

- **Remove strength/sweetness fields** from Recipe type and all usage
- **Replace database search** with simple in-memory name filtering
- **Remove search indexes** and complex search logic from existing models
- **Clean up unused database keys** (strength_recipes, sweetness_recipes, etc.)
- **Update UI components** to remove strength/sweetness inputs and displays
- **Simplify search routes** to use in-memory filtering only

### Phase 2: Data Structure Implementation

- **Implement new ULID-based key patterns** for user/public recipe separation
- **Create simplified models** using single Recipe type with different key
  patterns
- **Update database utilities** for new key patterns
- **Implement recipe copying** with `originalRecipeId` provenance tracking

### Phase 3: Query Optimization & Integration

- **Replace multiple `kv.get()` calls** with efficient `kv.list()` operations
- **Implement chronological sorting** using ULID ordering
- **Update routes and islands** for new data patterns
- **Add comprehensive tests** for new structure
- **Performance testing** and optimization validation

## Technical Considerations

### Key Pattern Design

- **ULID as key component**: Use existing ULIDs in key patterns for
  chronological ordering
- **Type interfaces unchanged**: Keep existing TypeScript types for API
  consistency

### Data Duplication Strategy

When users make recipes public, the recipe gets a new ULID and is stored in both
namespaces:

```typescript
// Original private recipe
["user_recipe", userId, originalUlid] → Recipe (visibility: "private")

// Making it public creates new public recipe with new ULID
["user_recipe", userId, originalUlid] → Recipe (visibility: "public", publicRecipeId: newUlid)
["public_recipe", newUlid] → Recipe (visibility: "public", originalRecipeId: originalUlid)
```

**Benefits of New ULID for Public Recipes:**

- **Independent creation timestamps**: Public recipes sort by when they were
  made public
- **Separate identity**: Public recipe has its own ID for sharing and references
- **Clear provenance**: `originalRecipeId` tracks the source user recipe
- **User recipe tracking**: `publicRecipeId` links to the public version

**Atomic Consistency:**

- **Making recipe public**: Atomic transaction updates user recipe and creates
  new public recipe
- **Updating public recipes**: Atomic transaction updates both user and public
  copies
- **KV check operations**: Prevent concurrent modification and ensure
  consistency

**Trade-offs Accepted:**

- **More storage usage**: Recipe data duplicated when public (acceptable cost)
- **Multiple writes**: Updates to public recipes require 2 writes (consistency
  over speed)
- **Query efficiency**: Independent listing of user collections and public
  recipes

### Type Impact Analysis

- **Single Recipe type**: Use existing `Recipe` interface for both user and
  public recipes
- **Field changes**: Remove `strength` and `sweetness` fields, add optional
  `originalRecipeId` and `publicRecipeId` fields
- **No separate types needed**: `UserRecipe` and `PublicRecipe` types not
  required
- **API consistency**: Other fields (`createdAt`/`updatedAt`) remain unchanged
- **ULID transparency**: ULIDs used internally for sorting while preserving
  familiar timestamp fields
- **Performance source**: Gains come from key pattern optimization and
  simplified data model

### Testing Strategy

- **Unit Tests**: Test all new model methods with `:memory:` KV instances
- **Integration Tests**: Test complete user flows with new data structure
- **Performance Tests**: Verify `kv.list()` vs `kv.get()` performance
  improvements
- **Load Tests**: Test with realistic data volumes

## Dependencies

- `utils/db/` models require complete refactoring
- Route handlers need updates for new data patterns
- Islands components need new API integrations
- Test suites require updates for new structure
- **Type updates**: Remove `strength` and `sweetness` fields, add optional
  `originalRecipeId` and `publicRecipeId` fields to Recipe interface
- **UI components**: Remove strength/sweetness inputs and displays
- **Search simplification**: Replace complex database search with simple
  in-memory name filtering

## Acceptance Criteria

### Definition of Done

- [ ] User recipe collections load using `kv.list()` operations
- [ ] Public recipes are completely separated from user recipes
- [ ] Recipe copying works with source tracking
- [ ] Chronological sorting works for both public and user recipes
- [ ] `strength` and `sweetness` fields completely removed from codebase
- [ ] All tests pass with new data structure
- [ ] Performance improvements are measurable and documented

### Quality Gates

- **Performance**: Collection loading time reduced by >50%
- **Test Coverage**: >90% coverage for new model methods
- **Code Quality**: All linting and type checking passes

## Appendices

### A. ULID Benefits for Sorting

- **Lexicographic ordering**: ULIDs sort chronologically by creation time
- **No separate timestamp needed**: Creation time embedded in ULID
- **Efficient range queries**: Natural ordering enables fast time-based queries

### B. Key Pattern Migration

**Before**:

```typescript
["recipe", recipeId] → Recipe
["user_recipes", userId, recipeId] → boolean
["public_recipes", recipeId] → boolean
```

**After**:

```typescript
["user_recipe", userId, ulid] → Recipe
["public_recipe", newUlid] → Recipe
// Single Recipe type with visibility, originalRecipeId, and publicRecipeId fields
// Public recipes get new ULIDs when published for independent chronological ordering
```

### C. Performance Comparison

- **Current**: N `kv.get()` calls for user collection
- **Proposed**: Single `kv.list()` call with prefix filtering
- **Simplified Structure**: No separate metadata lookups required
- **Atomic Operations**: Single record updates instead of coordinated multi-key
  transactions
- **Expected Improvement**: 50-80% reduction in load time with simplified data
  access

---

**Status**: PRD Complete - Ready for implementation
