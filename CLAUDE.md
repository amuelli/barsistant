# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## 🔗 Core Instructions

**IMPORTANT**: Before working on this project, read the following instruction
files:

1. **[Project Instructions](/.github/instructions/project.instructions.md)** -
   Development conventions, workflow, testing requirements, and technical
   implementation patterns
2. **[Requirements](/.github/instructions/requirements.instructions.md)** -
   Functional requirements, non-functional requirements, technology stack, and
   quality standards
3. **[README](/README.md)** - Project overview, setup instructions, and
   environment configuration

These files contain the **primary** development guidelines. This CLAUDE.md file
supplements them with context-specific information.

## 🏗️ Project Overview

Barsistant is a smart cocktail recipe assistant built with Fresh (Deno) and
TypeScript. It helps users discover, create, and manage cocktail recipes with
AI-powered features including magic link authentication, recipe extraction from
URLs, and AI-generated recipe images.

## 🛠️ Development Commands

### Essential Commands

```bash
# Development
deno task start          # Start dev server with hot reload
deno task build          # Build for production
deno task preview        # Preview production build

# Quality Assurance (MANDATORY before completion)
deno task test           # Run all tests with proper permissions
deno task check          # Run formatter, linter, type checker (use instead of separate commands)

# Database Operations
deno task init-db        # Initialize database
deno task migration:create # Create new migration
deno task migration:run  # Apply pending migrations
deno task migration:status # Check migration status

# AI/Recipe Tools
deno task extract-recipes    # Extract recipes from URLs
deno task eval-extraction    # Evaluate extraction quality
```

### Single Test Execution

To run a specific test file, use the full deno test command with proper
permissions:

```bash
deno test --allow-all path/to/test_file.ts
```

## 🔐 Authentication System (Passwordless)

The app uses **magic link authentication** exclusively:

- Users request a magic link via email
- Links are validated server-side in `/routes/auth/verify.tsx`
- Sessions stored in Deno KV with HTTP-only cookies
- User state passed from server middleware via `state.user`
- **NO PASSWORD FUNCTIONALITY** - this is intentional

### Authentication Flow

1. User enters email → `/routes/auth/login.tsx`
2. Magic link sent via Resend → `/routes/api/auth/request-magic-link.ts`
3. User clicks link → `/routes/auth/verify.tsx` (server-side validation)
4. Session created → cookie set → redirect to app

## 🗄️ Database Architecture (Deno KV)

### Key Patterns

Follow these established patterns from `utils/db/db.ts`:

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

### Database Models Location

- Core models: `utils/db/` directory
- All database operations must use utilities from this directory
- Migration system: `utils/db/migrations/`

### Atomic Transaction Patterns (CRITICAL)

Always use atomic transactions for related operations:

```typescript
// Example: Creating recipe with ingredients
export async function createRecipeWithIngredients(
  recipeData: RecipeInput,
  ingredients: IngredientInput[],
) {
  const kv = await getKv();
  const recipeId = crypto.randomUUID();

  // Atomic transaction for consistency
  const tx = kv.atomic();

  // Create recipe
  tx.set(["recipe", recipeId], {
    ...recipeData,
    id: recipeId,
    createdAt: new Date(),
  });

  // Create recipe-ingredient relationships
  for (const ingredient of ingredients) {
    const relationshipId = crypto.randomUUID();
    tx.set(
      ["recipe_ingredient", recipeId, ingredient.id],
      {
        id: relationshipId,
        recipeId,
        ingredientId: ingredient.id,
        amount: ingredient.amount,
        unit: ingredient.unit,
      },
    );

    // Update secondary indexes
    tx.set(
      ["ingredient_recipes", ingredient.id, recipeId],
      { recipeId },
    );
  }

  // Commit transaction
  const result = await tx.commit();
  if (!result.ok) {
    throw new Error("Failed to create recipe with ingredients");
  }

  return { success: true, recipeId };
}
```

### Key Transaction Rules:

- **Always use transactions** for operations affecting multiple keys
- **Check transaction result** with `result.ok` before proceeding
- **Include secondary indexes** in the same transaction
- **Handle cleanup** in separate transactions if needed

## 🛠️ Architecture Patterns

### State Management

- **Props over Context**: Pass user state as props instead of React Context
  (Fresh islands don't share context reliably)
- **Server-side state**: User authentication state comes from `/_middleware.ts`
- **Client-side signals**: Use Preact signals for UI state in islands

### AI Integration

**Provider-agnostic AI SDK**: Supports OpenAI, Anthropic

- Recipe extraction: `utils/ai/extraction.ts`
- Image generation: `utils/ai/image-generation.ts` (DALL-E)
- Vector images: `utils/ai/recraft.ts` (SVG generation)
- Non-blocking processing via Deno KV queues

### Fresh Framework Specifics

- **Routes**: `/routes/` directory contains pages and API endpoints
- **Islands**: `/islands/` directory for client-side interactive components
- **Middleware**: Global auth middleware in `/_middleware.ts`
- **Static assets**: `/static/` directory

### UI System

- **DaisyUI Components**: Consistent component library with custom "barsistant"
  theme
- **Tailwind CSS v4**: Modern styling with OKLCH colors
- **Mobile-first**: Responsive design with dock navigation
- All buttons must have `type="button"` attribute

## 📁 Important Files & Patterns

### Authentication Files

- `/_middleware.ts` - Sets `ctx.state.user` for all requests
- `/utils/auth/middleware.ts` - Auth helper functions (`requireAuth`,
  `optionalAuth`)
- `/utils/auth/session.ts` - Session management with Deno KV
- `/utils/auth/user.ts` - User CRUD operations

### Key Components

- **AuthNav** (`/islands/AuthNav.tsx`): Shows sign-in button or user dropdown
- **Mobile dock**: Bottom navigation with authentication-aware buttons
- **RecipeExtractor** (`/islands/RecipeExtractor.tsx`): AI-powered recipe
  extraction interface
- **RecipeImage** (`/islands/RecipeImage.tsx`): Smart image display with
  fallbacks

### Email Configuration

- `/utils/email/service.ts` - Resend integration (default:
  `hello@barsistant.com`)
- `/utils/email/templates.ts` - Magic link and welcome email templates

### Storage Integration

- S3-compatible storage: `utils/storage/` directory
- AI-generated images stored with public URLs
- Background processing via Deno KV queues

## 🔧 Development Workflow

1. **Read the instruction files** (linked above)
2. **Follow established patterns**: Check existing code for conventions
3. **Run tests**: `deno task test` (MANDATORY before completion)
4. **Check code quality**: `deno task check` (formatter, linter, type checker)
5. **Database operations**: Use utilities from `utils/db/`
6. **Test thoroughly** - authentication flows, mobile experience, error cases

### Implementation Checklist (Use TodoWrite for tracking)

For EVERY task, follow this systematic approach:

#### Planning Phase:

- [ ] Use TodoWrite tool to create specific, actionable tasks
- [ ] Read related existing code to understand patterns
- [ ] Verify all required dependencies exist in the codebase
- [ ] Define TypeScript types and interfaces first

#### Implementation Phase:

- [ ] Follow established patterns from similar components
- [ ] Implement comprehensive error handling with specific error types
- [ ] Use atomic database transactions for related operations
- [ ] Ensure mobile-responsive design from the start
- [ ] Add logging for debugging (use `console.error` for errors)

#### Testing Phase (CRITICAL):

- [ ] Write tests for ALL code paths including error scenarios
- [ ] Test database operations with cleanup (avoid data pollution)
- [ ] Verify mobile responsiveness and accessibility
- [ ] Run `deno task test` and resolve ALL failures
- [ ] Run `deno task check` and resolve ALL formatting/lint issues

#### Documentation Phase:

- [ ] Update TodoWrite tasks as completed
- [ ] Follow commit message conventions
- [ ] Update relevant documentation files if needed

## 🚨 Critical Reminders

- **NO PASSWORDS**: This is a magic link only system
- **Props not Context**: Pass user state via props in Fresh
- **Test everything**: All tests must pass before completion
- **Mobile-first**: Consider dock navigation and responsive design
- **Database patterns**: Follow established KV key patterns for consistency
- **AI processing**: Use background queues for non-blocking operations
- **Type safety**: Comprehensive TypeScript types in `/types/` directory

## 🧪 Testing Patterns & Examples

### Test Structure Template:

```typescript
Deno.test("ComponentName", async (t) => {
  const kv = await Deno.openKv(":memory:");

  await t.step("should handle success case", async () => {
    // Setup test data
    const testData = {/* mock data */};

    // Execute function
    const result = await functionUnderTest(testData);

    // Assert results
    assert(result.success);
    assertEquals(result.data.id, testData.id);
  });

  await t.step("should handle error case", async () => {
    // Test error scenarios
    await assertRejects(
      () => functionUnderTest(invalidData),
      Error,
      "Expected error message",
    );
  });

  await t.step("cleanup", async () => {
    await kv.close();
  });
});
```

### Database Testing Best Practices:

- Use `:memory:` KV instances for tests
- Always clean up test data in cleanup steps
- Test both success and error paths
- Mock external dependencies (AI, email, S3)
- Verify atomic transactions work correctly

## 🎯 Mobile-First Development

### Mobile Design Requirements:

- **Touch targets**: Minimum 44px for buttons and interactive elements
- **Navigation**: Use dock component for primary mobile navigation
- **Responsive breakpoints**:
  - Mobile-first: default styles
  - Desktop: `lg:` prefix for large screens
  - Hide/show: `lg:hidden` / `hidden lg:block`
- **Layout patterns**:
  - Mobile: Card-based layouts, single column
  - Desktop: Table layouts, multi-column grids

### Mobile Testing Checklist:

- [ ] Test on mobile viewport (390px width)
- [ ] Verify dock navigation works correctly
- [ ] Check touch target sizing
- [ ] Ensure text is readable without zooming
- [ ] Verify form inputs work with mobile keyboards

## 🔍 Error Handling & Debugging

### Error Handling Patterns:

```typescript
// Use specific error types
export class ValidationError extends Error {
  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`);
    this.name = "ValidationError";
  }
}

// Function with proper error handling
export async function createRecipe(data: RecipeInput) {
  try {
    // Validation
    if (!data.name?.trim()) {
      throw new ValidationError("name", "Recipe name is required");
    }

    // Implementation with logging
    console.log(`Creating recipe: ${data.name}`);
    const result = await recipeService.create(data);

    return { success: true, data: result };
  } catch (error) {
    console.error(`Failed to create recipe:`, error);

    if (error instanceof ValidationError) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Internal server error" };
  }
}
```

### Common Debugging Scenarios:

- **Database issues**: Check KV key patterns and atomic transactions
- **Authentication problems**: Verify middleware chain and session handling
- **Mobile layout issues**: Check responsive classes and touch targets
- **Test failures**: Ensure proper cleanup and mock dependencies
- **Fresh routing**: Verify file-based routing conventions

## ⚡ Performance & Optimization

### Database Optimization:

- Use batch operations for multiple related writes
- Implement proper pagination for large datasets
- Cache frequently accessed data appropriately
- Monitor KV operation performance

### UI Performance:

- Lazy load images and heavy components
- Use Preact signals efficiently
- Minimize re-renders with proper memoization
- Optimize bundle size with tree shaking

## 📦 Technology Stack

- **Runtime**: Deno with TypeScript
- **Framework**: Fresh 2.0 (Deno web framework) with Preact
- **Database**: Deno KV (built-in key-value store)
- **UI**: Tailwind CSS v4 + DaisyUI v5
- **AI**: Provider-agnostic AI SDK (OpenAI, Anthropic)
- **Email**: Resend service
- **Storage**: S3-compatible storage
- **Dependencies**: JSR (JavaScript Registry) for modern imports

## 🔗 Quick Reference

- **Instructions**: `.github/instructions/` (PRIMARY source of truth)
- **Setup**: **[README.md](/README.md)**
- **Tasks**: **[docs/tasks.md](/docs/tasks.md)**
- **Types**: `types/` directory
- **Database**: `utils/db/` patterns
- **Testing**: `deno task test` (required)

---

For detailed development guidelines, testing requirements, and conventions, see
the instruction files in `.github/instructions/`.
