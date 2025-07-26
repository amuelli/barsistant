# Product Requirements Document: Barsistant Database Migration from Deno KV to Supabase

**Document Version:** 1.0\
**Date:** January 2025\
**Author:** Development Team\
**Status:** Draft

## Executive Summary

This PRD outlines the migration of Barsistant's database layer from Deno KV
(key-value store) to Supabase (PostgreSQL-based) with a **fresh start
approach**. Rather than migrating existing data, we will start with an empty
Supabase database and implement new database operations while maintaining app
functionality. Deno KV will be retained exclusively for the job queue system.
This approach enables enhanced data relationships, improved query performance,
better scalability, and access to advanced features like real-time subscriptions
and Row Level Security (RLS).

## Table of Contents

1. [Project Overview](#project-overview)
2. [Current State Analysis](#current-state-analysis)
3. [Target State Architecture](#target-state-architecture)
4. [Business Requirements](#business-requirements)
5. [Technical Requirements](#technical-requirements)
6. [Database Schema Design](#database-schema-design)
7. [Migration Strategy](#migration-strategy)
8. [Implementation Phases](#implementation-phases)
9. [Risk Assessment](#risk-assessment)
10. [Success Metrics](#success-metrics)
11. [Timeline](#timeline)
12. [Resources](#resources)

## Project Overview

### Context

Barsistant currently uses Deno KV as its primary database, which has served well
for initial development but now limits our ability to:

- Perform complex relational queries efficiently
- Implement advanced search and filtering
- Scale to handle growing user and recipe data
- Provide real-time features
- Leverage PostgreSQL's rich feature set

### Objectives

- **Primary**: Replace Deno KV database operations with Supabase PostgreSQL
- **Secondary**: Maintain all application functionality with improved
  performance
- **Tertiary**: Enable advanced features (real-time, advanced search, analytics)
- **Quaternary**: Retain Deno KV exclusively for job queue operations

### Success Criteria

- No downtime during deployment
- All application features continue working
- Improved query performance and capabilities
- Successful hybrid architecture (Supabase + KV job queue)
- Enhanced development velocity for new features

## Current State Analysis

### Database Structure (Deno KV)

#### Key Patterns

```typescript
// Primary entities
["recipe", recipeId] → Recipe
["ingredient", ingredientId] → Ingredient  
["user", userId] → User

// Relationships
["recipe_ingredient", recipeId, ingredientId] → RecipeIngredient
["user_favorites", userId, recipeId] → UserFavorite
["user_inventory", userId, ingredientId] → UserInventoryItem
["user_collections", userId, recipeId] → UserCollection

// Authentication
["auth_tokens", token] → MagicLinkToken
["user_sessions", sessionId] → UserSession
["user_emails", email] → userId

// Secondary indexes
["ingredient_recipes", ingredientId, recipeId] → RecipeReference
["tag_recipes", tag, recipeId] → RecipeReference
["public_recipes", recipeId] → RecipeReference
["user_recipes", userId, recipeId] → RecipeReference
["strength_recipes", strength, recipeId] → RecipeReference
["sweetness_recipes", sweetness, recipeId] → RecipeReference
```

#### Data Models

- **Recipes**: 43 fields including nested ingredients, images, source info
- **Ingredients**: 8 fields with type classification and allergen info
- **Users**: 6 fields with preferences and authentication data
- **Relationships**: Complex many-to-many between recipes/ingredients/users

#### Current Limitations

1. **Query Complexity**: Limited ability to perform joins and complex filtering
2. **Indexing**: Manual secondary index maintenance required
3. **Transactions**: Limited atomic transaction capabilities across
   relationships
4. **Search**: No full-text search capabilities
5. **Analytics**: Difficult to generate insights from relationships
6. **Backup/Recovery**: Limited built-in backup options
7. **Scaling**: No horizontal scaling capabilities

## Target State Architecture

### Hybrid Architecture Benefits

1. **PostgreSQL Power**: Full SQL capabilities, ACID transactions, advanced
   indexing
2. **Row Level Security**: Fine-grained access control at database level
3. **Admin Dashboard**: Visual database management and monitoring
4. **Auto-generated APIs**: RESTful and GraphQL APIs from schema
5. **Full-text Search**: Built-in PostgreSQL text search capabilities
6. **JSON Support**: Native JSONB for complex data structures
7. **Job Queue Reliability**: Keep proven KV-based job processing
8. **Scaling**: Built-in connection pooling and read replicas
9. **Future Extensibility**: Real-time features available when needed

### Architecture Components

```
Frontend (Fresh/Preact)
↓
Application Layer
├── Supabase Client SDK (Primary Data)
└── Deno KV Client (Job Queue Only)
↓
Data Layer
├── Supabase PostgreSQL (Users, Recipes, Ingredients)
└── Deno KV (Background Jobs, Image Processing Queue)
```

### Data Separation Strategy

- **Supabase**: All user-facing data (users, recipes, ingredients, collections,
  auth)
- **Deno KV**: Background job processing, image generation queue, temporary
  processing data

## Business Requirements

### Functional Requirements

#### F1: Application Continuity

- All current application features must continue working
- Users start with empty collections (acceptable fresh start)
- New data creation works seamlessly with Supabase
- Maintain recipe visibility and user authentication patterns

#### F2: Feature Parity

- All current application features must continue working
- Recipe CRUD operations (create, read, update, delete)
- User authentication via magic links
- Recipe search and filtering
- User favorites and collections
- Admin recipe management

#### F3: Job Queue Continuity

- Background job processing continues using Deno KV
- AI image generation queue remains unchanged
- Recipe extraction jobs continue working
- Email sending and processing jobs maintained

#### F4: Enhanced Capabilities

- **Advanced Search**: Full-text search across recipe names, ingredients,
  descriptions
- **Better Performance**: Complex queries execute in <200ms
- **Analytics**: Basic usage analytics for admin users
- **Enhanced Security**: Row-level security for user data isolation
- **Real-time Updates**: Optional future enhancement (not critical)

### Non-Functional Requirements

#### NF1: Performance

- API response times <200ms for 95% of queries
- Support for 1,000+ concurrent users
- Search queries return results in <100ms
- Image upload/processing remains asynchronous

#### NF2: Reliability

- 99.9% uptime during deployment
- Automated backups for new data
- Point-in-time recovery capability
- Job queue reliability maintained through KV

#### NF3: Security

- Row-level security for user data isolation
- Encrypted data at rest and in transit
- Magic link authentication maintained
- Admin access controls preserved

#### NF4: Scalability

- Handle 10x current data volume (recipes, users, relationships)
- Horizontal scaling capability through read replicas
- Connection pooling for efficient resource usage

## Database Schema Design

### Core Tables

#### users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    preferences JSONB DEFAULT '{"theme": "system", "preferredMeasurementUnit": "metric"}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);
```

#### ingredients

```sql
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type ingredient_type NOT NULL,
    abv DECIMAL(5,2),
    image TEXT,
    allergens TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE ingredient_type AS ENUM (
    'spirit', 'liqueur', 'wine', 'fortified_wine', 
    'mixer', 'juice', 'syrup', 'bitter', 
    'fruit', 'herb', 'spice', 'other'
);
```

#### recipes

```sql
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    strength INTEGER CHECK (strength >= 0 AND strength <= 10),
    sweetness INTEGER CHECK (sweetness >= 0 AND sweetness <= 10),
    garnish TEXT[],
    glassware glassware_type,
    preparation TEXT[],
    source JSONB,
    images JSONB,
    tags TEXT[],
    rating DECIMAL(3,2),
    created_by UUID REFERENCES users(id),
    visibility recipe_visibility DEFAULT 'private',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Full-text search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || array_to_string(tags, ' '))
    ) STORED
);

CREATE TYPE recipe_visibility AS ENUM ('private', 'public');
CREATE TYPE glassware_type AS ENUM (
    'collins', 'coupe', 'fizz', 'highball', 'hurricane',
    'irish-coffee', 'margarita', 'martini', 'nick-and-nora',
    'old-fashioned', 'rocks', 'shot', 'sour', 'wine'
);
```

### Relationship Tables

#### recipe_ingredients

```sql
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Denormalized for performance
    quantity DECIMAL(10,3) NOT NULL,
    unit measurement_unit NOT NULL,
    optional BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    UNIQUE(recipe_id, ingredient_id)
);

CREATE TYPE measurement_unit AS ENUM (
    'ml', 'oz', 'cl', 'dash', 'drop', 'barspoon', 'tsp', 'tbsp',
    'cup', 'pint', 'part', 'piece', 'slice', 'whole', 'pinch',
    'spritz', 'leaf', 'sprig', 'rim', 'count'
);
```

#### user_collections

```sql
CREATE TABLE user_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    collection_type collection_type NOT NULL,
    notes TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, recipe_id)
);

CREATE TYPE collection_type AS ENUM ('owned', 'saved');
```

#### user_inventory

```sql
CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(10,3),
    unit TEXT,
    in_stock BOOLEAN DEFAULT TRUE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, ingredient_id)
);
```

### Authentication Tables

#### auth_tokens

```sql
CREATE TABLE auth_tokens (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    expires TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### user_sessions

```sql
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_active TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes and Performance

```sql
-- Recipe search and filtering
CREATE INDEX idx_recipes_search ON recipes USING GIN(search_vector);
CREATE INDEX idx_recipes_visibility ON recipes(visibility);
CREATE INDEX idx_recipes_created_by ON recipes(created_by);
CREATE INDEX idx_recipes_strength ON recipes(strength);
CREATE INDEX idx_recipes_sweetness ON recipes(sweetness);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);

-- Recipe ingredients relationships
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);

-- User data
CREATE INDEX idx_user_collections_user ON user_collections(user_id);
CREATE INDEX idx_user_collections_recipe ON user_collections(recipe_id);
CREATE INDEX idx_user_collections_type ON user_collections(collection_type);
CREATE INDEX idx_user_inventory_user ON user_inventory(user_id);

-- Authentication
CREATE INDEX idx_auth_tokens_email ON auth_tokens(email);
CREATE INDEX idx_auth_tokens_expires ON auth_tokens(expires);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all user-specific tables
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY user_collections_policy ON user_collections
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY user_inventory_policy ON user_inventory
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY user_sessions_policy ON user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Recipe visibility policies
CREATE POLICY recipes_public_read ON recipes
    FOR SELECT USING (visibility = 'public');

CREATE POLICY recipes_owner_access ON recipes
    FOR ALL USING (auth.uid() = created_by);
```

## Migration Strategy

### Approach: Fresh Start with Code Replacement

This approach prioritizes simplicity and reliability by starting fresh rather
than migrating data.

#### Phase 1: Schema Setup & Client Integration

1. Create Supabase project and configure environment
2. Deploy PostgreSQL schema with all tables, indexes, and constraints
3. Set up Row Level Security policies
4. Create Supabase client integration layer

#### Phase 2: Code Refactoring

1. Create new data access layer for Supabase operations
2. Refactor database operations from KV to Supabase calls
3. Maintain KV usage only for job queue operations
4. Update TypeScript types to match new schema

#### Phase 3: Feature-by-Feature Replacement

1. Replace authentication system (users, sessions)
2. Replace recipe operations (CRUD, search)
3. Replace ingredient operations
4. Replace user collections and favorites
5. Keep job queue operations on KV

#### Phase 4: Testing & Validation

1. Comprehensive testing of all features
2. Performance validation
3. Security testing (RLS, auth flows)
4. Job queue integration testing

#### Phase 5: Deployment

1. Deploy updated application with Supabase integration
2. Monitor performance and functionality
3. Clean up unused KV operations (keep job queue)
4. Enable advanced features (real-time, enhanced search)

### Code Architecture Changes

#### Supabase Type Generation

```bash
# Generate TypeScript types from Supabase schema
supabase gen types typescript --project-id=your-project-id > types/supabase.ts

# Update types automatically in development
supabase start
supabase gen types typescript --local > types/supabase.ts
```

#### Generated Type Usage

```typescript
// Import generated types
import { Database } from "./types/supabase.ts";
type Recipe = Database["public"]["Tables"]["recipes"]["Row"];
type RecipeInsert = Database["public"]["Tables"]["recipes"]["Insert"];
type RecipeUpdate = Database["public"]["Tables"]["recipes"]["Update"];

// Type-safe Supabase operations
const supabase = createClient<Database>(url, key);

// Fully typed operations
const { data, error } = await supabase
  .from("recipes")
  .select("*")
  .eq("visibility", "public")
  .returns<Recipe[]>();
```

#### Database Client Abstraction

```typescript
// Create unified interface for both systems
interface DatabaseClient {
  // Supabase operations for primary data
  supabase: SupabaseClient;

  // KV operations for job queue only
  kv: Deno.Kv;
}

// New Supabase operations replace KV
class RecipeService {
  async create(recipe: Recipe): Promise<Recipe> {
    // OLD: await kv.set(["recipe", id], recipe)
    // NEW: Supabase insert
    const { data, error } = await this.supabase
      .from("recipes")
      .insert(recipe)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// Job queue operations remain on KV
class JobQueue {
  async enqueue(job: ImageGenerationJob): Promise<void> {
    // Keep existing KV job queue implementation
    await this.kv.enqueue(job, { delay: 0 });
  }
}
```

#### Progressive Replacement Strategy

1. **Authentication**: Replace KV auth with Supabase Auth
2. **User Data**: Replace KV user operations with Supabase
3. **Recipe Data**: Replace KV recipe operations with Supabase
4. **Keep Jobs**: Maintain all background job processing on KV

### Rollback Strategy

1. **Immediate Rollback**: Deploy previous version using KV for everything
2. **Configuration Rollback**: Disable Supabase environment variables
3. **Feature Flags**: Use feature flags to switch between KV and Supabase per
   feature
4. **Gradual Revert**: Roll back feature by feature if needed

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

- [ ] Set up Supabase project and environment
- [ ] Create PostgreSQL schema and tables
- [ ] Generate TypeScript types from Supabase schema
- [ ] Implement Supabase client integration with generated types
- [ ] Create hybrid data access layer (Supabase + KV jobs)
- [ ] Set up development and testing environments

### Phase 2: Authentication Migration (Weeks 3-4)

- [ ] Replace KV auth system with Supabase Auth
- [ ] Migrate user registration and login flows
- [ ] Update session management
- [ ] Implement Row Level Security policies
- [ ] Test authentication thoroughly

### Phase 3: Core Data Migration (Weeks 5-6)

- [ ] Replace recipe operations with Supabase
- [ ] Replace ingredient operations with Supabase
- [ ] Replace user collection operations with Supabase
- [ ] Maintain job queue operations on KV
- [ ] Update TypeScript types and interfaces

### Phase 4: Feature Completion (Weeks 7-8)

- [ ] Replace search functionality with PostgreSQL full-text search
- [ ] Update admin interfaces to use Supabase
- [ ] Implement enhanced query capabilities
- [ ] Comprehensive testing of all features
- [ ] Performance optimization

### Phase 5: Deployment & Monitoring (Weeks 9-10)

- [ ] Deploy to production with feature flags
- [ ] Monitor performance and functionality
- [ ] Clean up unused KV operations (preserve job queue)
- [ ] Documentation and team training
- [ ] Enable advanced search features

## Risk Assessment

### High-Impact Risks

#### R1: Data Loss During Migration

- **Likelihood**: Low
- **Impact**: Critical
- **Mitigation**:
  - Comprehensive backup strategy
  - Data validation at every step
  - Rollback procedures tested
  - Staged migration approach

#### R2: Performance Degradation

- **Likelihood**: Medium
- **Impact**: High
- **Mitigation**:
  - Extensive performance testing
  - Query optimization
  - Index tuning
  - Connection pooling
  - Monitoring and alerting

#### R3: Extended Downtime

- **Likelihood**: Low
- **Impact**: High
- **Mitigation**:
  - Zero-downtime migration strategy
  - Dual-write approach
  - Quick rollback capability
  - Real-time monitoring

### Medium-Impact Risks

#### R4: Complex Query Migration Issues

- **Likelihood**: Medium
- **Impact**: Medium
- **Mitigation**:
  - Extensive testing of query patterns
  - Performance benchmarking
  - Query optimization expertise
  - Fallback to simpler queries if needed

#### R5: Authentication System Disruption

- **Likelihood**: Low
- **Impact**: Medium
- **Mitigation**:
  - Careful session migration
  - Maintain magic link system integrity
  - Test authentication flows thoroughly
  - Preserve user experience

## Success Metrics

### Technical Metrics

- **Data Integrity**: 100% data preservation (zero tolerance for loss)
- **Performance**: >50% improvement in complex query times
- **Uptime**: >99.9% availability during migration
- **Response Times**: <200ms for 95% of API calls
- **Search Performance**: <100ms for full-text search queries

### Business Metrics

- **User Experience**: No degradation in core functionality
- **Feature Enablement**: Real-time updates and advanced search working
- **Admin Efficiency**: Improved admin tools and analytics
- **Development Velocity**: Faster feature development post-migration

### Operational Metrics

- **Migration Time**: Complete migration within 12-week timeline
- **Team Productivity**: Minimal disruption to ongoing development
- **Support Requests**: No increase in user-reported issues
- **Resource Usage**: Optimized database connection usage

## Timeline

### 10-Week Implementation Schedule

| Week | Phase          | Key Deliverables                                 |
| ---- | -------------- | ------------------------------------------------ |
| 1-2  | Foundation     | Supabase setup, schema creation, type generation |
| 3-4  | Authentication | Auth migration, RLS setup, user flows            |
| 5-6  | Core Data      | Recipe/ingredient operations, collections        |
| 7-8  | Features       | Search, admin interfaces, optimization           |
| 9-10 | Deployment     | Production deployment, monitoring, cleanup       |

### Critical Milestones

- **Week 2**: Schema deployed, types generated, dev environment ready
- **Week 4**: Authentication fully migrated and tested
- **Week 6**: All core data operations using Supabase
- **Week 8**: All features complete and tested
- **Week 10**: Production deployment complete

## Resources

### Team Requirements

- **Lead Developer**: Migration strategy and implementation oversight
- **Backend Developer**: Data access layer and migration scripts
- **Database Engineer**: Schema design and performance optimization
- **QA Engineer**: Comprehensive testing and validation
- **DevOps Engineer**: Infrastructure setup and monitoring

### Tools and Services

- **Supabase Pro**: Production-grade PostgreSQL with support
- **Migration Tools**: Custom scripts for KV to PostgreSQL transformation
- **Monitoring**: Comprehensive logging and alerting system
- **Testing**: Load testing tools and data validation utilities
- **Backup**: Automated backup and point-in-time recovery

### Budget Considerations

- **Supabase Pro**: $25/month production environment
- **Development Tools**: Minimal additional cost
- **Team Time**: 12 weeks of focused development effort
- **Testing Infrastructure**: Temporary additional resources for load testing

## Appendices

### A. Current KV Key Patterns

[Detailed documentation of all current KV key patterns and their relationships]

### B. PostgreSQL Schema Details

[Complete SQL schema with all tables, indexes, and constraints]

### C. Migration Scripts

[Reference to migration script locations and usage instructions]

### D. Testing Procedures

[Detailed testing procedures for data validation and performance verification]

### E. Rollback Procedures

[Step-by-step rollback procedures for various failure scenarios]

---

**Document Status**: Draft\
**Next Review**: [Date]\
**Approval Required**: Technical Lead, Product Owner, DevOps Lead
