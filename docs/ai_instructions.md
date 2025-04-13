# AI Instructions for Barsistant Development

This document provides guidelines for AI assistants helping with the
implementation of the Barsistant project. Following these instructions will
ensure consistent, high-quality code that aligns with project requirements and
best practices.

## General Guidelines

### Code Style and Formatting

- Use TypeScript for all implementation work
- Follow Deno's style guide and formatting conventions
- Use explicit type annotations for function parameters and return types
- Prefer async/await over callbacks or raw promises
- Prioritize readability over clever/complex code
- Use JSR package imports (e.g., `import { assertEquals } from "@std/assert"`)
  instead of direct URL imports

### Project Architecture

- Follow Fresh framework conventions for routing and component structure
- Use Preact for UI components with Signals for state management
- Keep UI components and business logic separated
- Store shared types in dedicated type files
- Place API routes in the `routes/api/` directory
- Implement utility functions in the `utils/` directory

### Deno KV Implementation

- Use the database utility module at `utils/db.ts` for all database operations
- Follow the key structure patterns outlined in the requirements document
- Use atomic operations and transactions to maintain data consistency
- Use the provided error handling for database operations via
  `executeDbOperation`
- Use the recipe helpers (`recipes.get`, `recipes.set`, etc.) for recipe
  operations
- Use secondary indexes effectively for query optimization
- Document key structures and query patterns in code comments
- Remember to include the `/// <reference lib="deno.unstable" />` directive in
  files that use Deno KV

### UI Development

- Use Tailwind CSS utility classes for styling
- Leverage daisyUI components when appropriate
- Ensure responsive design for all UI components
- Maintain accessibility standards (WCAG compliance)
- Implement dark mode support using daisyUI themes

## Implementation Process

When implementing a task from the task list, follow these steps:

1. **Understanding**: Fully understand the task requirements and how it fits
   into the overall system
2. **Planning**: Create a brief implementation plan before writing code
3. **Development**:
   - Start with type definitions
   - Implement core functionality
   - Add error handling
   - Include inline documentation
4. **Integration**: Ensure the implementation works with existing code
5. **Testing**: Include suggestions for test cases
6. **Verification**: Use Browser MCP whenever possible to verify frontend
   changes and iterate until successfully verified. For backend or complex
   logic, implement appropriate unit tests instead.
7. **Self-Iteration**: When verification fails, independently iterate on the
   implementation without waiting for user intervention. Make necessary
   adjustments, identify root causes of issues, and continue refining the
   solution until verification succeeds.
8. **Documentation Update**: Always update or extend relevant documentation in
   the docs directory to reflect the changes made by the task. This includes
   updating [README.md](/README.md), [requirements.md](/docs/requirements.md),
   or [tasks.md](/docs/tasks.md) as applicable, marking completed tasks, and
   documenting any architectural decisions or patterns established.

## Code Documentation

- Add JSDoc comments for functions, classes, and interfaces
- Document parameters, return values, and thrown exceptions
- Include examples for complex functions
- Explain non-obvious implementation choices
- Document key database operations and their patterns

## Error Handling

- Use specific error types and messages
- Handle all potential error conditions
- Log errors with appropriate context
- Provide user-friendly error messages in UI components
- Use try/catch blocks for error recovery

## Security Considerations

- Sanitize all user inputs
- Validate data before storage or processing
- Use environment variables for sensitive configuration
- Implement proper permission checking for protected operations
- Follow secure coding practices to prevent common vulnerabilities

## Performance Optimization

- Avoid unnecessary database queries
- Use caching for frequently accessed data
- Optimize UI rendering with appropriate component design
- Consider pagination for large data sets
- Use efficient data structures and algorithms

## Example Implementation Pattern

When implementing a new feature, follow this general pattern:

```typescript
// 1. Import dependencies using JSR style
import { type FreshContext } from "$fresh/server.ts";
import { ulid } from "@std/ulid";
import { executeDbOperation, kv, recipes } from "../utils/db.ts";
import type { Recipe } from "../types/recipe.ts";

// 2. Define types specific to this implementation
interface CreateRecipeParams {
  name: string;
  description: string[];
  instructions: string[];
  // Additional fields...
}

// 3. Implement the core functionality with proper error handling
export async function createRecipe(
  params: CreateRecipeParams,
): Promise<Recipe> {
  return executeDbOperation(async () => {
    // Validate inputs
    if (!params.name || params.name.trim() === "") {
      throw new Error("Recipe name is required");
    }

    // Generate unique ID
    const id = ulid();
    const now = new Date();

    // Prepare data
    const recipe: Recipe = {
      id,
      name: params.name.trim(),
      description: params.description || "",
      instructions: params.instructions || [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // Store recipe using the recipes helper
    await recipes.set(id, recipe);

    return recipe;
  }, "Failed to create recipe");
}

// 4. For API handlers, use this structure:
export async function handler(req: Request, ctx: FreshContext) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const params = await req.json() as CreateRecipeParams;
    const recipe = await createRecipe(params);
    return Response.json(recipe);
  } catch (error) {
    if (error.name === "DatabaseError") {
      console.error("Database error:", error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

## Final Checklist

Before considering a task complete, ensure:

- [ ] All requirements of the task are implemented
- [ ] The code follows Deno and Fresh conventions
- [ ] The code uses JSR-style imports where applicable
- [ ] Database operations use the `utils/db.ts` module
- [ ] Proper error handling is in place
- [ ] Types are defined and used correctly
- [ ] The code is properly documented
- [ ] Edge cases are handled
- [ ] Integration with existing code is smooth
- [ ] The implementation is efficient and performant
- [ ] Security considerations are addressed
- [ ] Tests are written for critical functionality
- [ ] The unstable-kv flag is included where needed

By following these guidelines, AI assistants can help implement the Barsistant
project in a consistent, maintainable, and effective manner that aligns with the
overall project goals and architecture.
