---
applyTo: '**'
---

# AI Instructions for Barsistant Development

This document provides guidelines for AI assistants helping with the
implementation of the Barsistant project. Following these instructions will
ensure consistent, high-quality code that aligns with project requirements and
best practices.

## General Guidelines

### Code Style and Formatting

- Use TypeScript for all implementation work with explicit type annotations
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

### JSR Package Integration

Fresh 2.0 integrates smoothly with JSR (JavaScript Registry) for package
management:

1. **Package Imports**: Use JSR-style imports in your code:
   ```typescript
   // Instead of URL imports like:
   // import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

   // Use JSR imports:
   import { assertEquals } from "@std/assert";
   ```

2. **Package Configuration in deno.json**:
   ```json
   {
     "imports": {
       "@std/assert": "jsr:@std/assert@0.216.0",
       "@preact/signals": "jsr:@preact/signals@1.2.1",
       "fresh": "jsr:@fresh/fresh@2.0.0",
       "preact": "jsr:@preact/preact@10.18.1",
       "preact/": "jsr:@preact/preact@10.18.1/",
       "daisyui": "npm:daisyui@^5.0.0"
     },
     "tasks": {
       "start": "deno run -A --unstable-kv dev.ts"
     }
   }
   ```

3. **Adding New Dependencies**: Use JSR packages whenever possible for
   consistent dependency management:
   ```bash
   deno add @std/http
   ```

## Fresh 2.0 Conventions

### Project Structure

- Use the new Fresh 2.0 project structure with `main.ts` and `dev.ts` instead of
  `fresh.config.ts`
- Delete `fresh.gen.ts` and `fresh.config.ts` files as they are no longer needed

### Main Configuration Files

#### dev.ts

Use the `Builder` class for development configuration:

```typescript
import { Builder } from "fresh/dev";
import { tailwind } from "@pakornv/fresh-plugin-tailwindcss";
import { app } from "./main.ts";

// Pass development only configuration here
const builder = new Builder({ target: "safari12" });

// Enable the tailwind plugin for Fresh
tailwind(builder, app, {});

// Create optimized assets for the browser when
// running `deno run -A dev.ts build`
if (Deno.args.includes("build")) {
  await builder.build(app);
} else {
  // ...otherwise start the development server
  await builder.listen(app);
}
```

#### main.ts

Use the `App` class for production configuration:

```typescript
// main.ts
import { App, fsRoutes, staticFiles } from "fresh";

export const app = new App()
  // Add static file serving middleware
  .use(staticFiles());

// Enable file-system based routing
await fsRoutes(app, {
  loadIsland: (path) => import(`./islands/${path}`),
  loadRoute: (path) => import(`./routes/${path}`),
});

// If this module is called directly, start the server
if (import.meta.main) {
  await app.listen();
}
```

### Error Pages

- Use a unified `_error.tsx` template instead of separate `_404.tsx` and
  `_500.tsx` templates
- Handle different error cases within `_error.tsx`:

```typescript
export default function ErrorPage(props: PageProps) {
  const error = props.error; // Contains the thrown Error or HTTPError
  if (error instanceof HttpError) {
    const status = error.status; // HTTP status code

    // Render a 404 not found page
    if (status === 404) {
      return <h1>404 - Page not found</h1>;
    }
  }

  return <h1>Oh no...</h1>;
}
```

### Head Content Management

- Do not use the `<Head>` component as it has been removed
- Use `ctx.state` to pass head-related data:

```typescript
// In a route or handler
export const handler = {
  GET(ctx) {
    ctx.state.title = "My Page Title";
    return page();
  },
};

// In _app.tsx
export default function AppWrapper(ctx: FreshContext) {
  return (
    <html lang="en">
      <head>
        {/* ... */}
        {ctx.state.title ? <title>{ctx.state.title}</title> : null}
      </head>
      <body>
        <ctx.Component />
      </body>
    </html>
  );
}
```

### Middleware and Handlers

- Use unified handler and middleware signatures with a single context parameter:

```typescript
// Middleware
const middleware = (ctx) => new Response("ok");

// Handlers
export const handler = {
  GET(ctx) {
    return new Response("ok");
  },
};

// Async route components
export default async function MyPage(props: PageProps) {
  const value = await loadFooValue();
  return <p>foo is: {value}</p>;
}
```

### Context Usage

- Use `HttpError` instead of `ctx.renderNotFound()`:

```typescript
// Old way
// return ctx.renderNotFound();

// New way
throw new HttpError(404);
```

- Updates to context properties:
  - Use `ctx.config.basePath` instead of `ctx.basePath`
  - Use `ctx.info.remoteAddr` instead of `ctx.remoteAddr`

### Working with Context in Fresh 2.0

Fresh 2.0 introduces a new context API with improved ergonomics:

1. **Context in Route Handlers**:
   ```typescript
   export const handler = {
     GET(ctx) {
       // Access request information
       const url = ctx.req.url;
       const headers = ctx.req.headers;

       // Access route params
       const id = ctx.params.id;

       // Access cookies
       const cookie = ctx.cookies.get("session");

       // Render with data
       return ctx.render({ data: "Hello" });
     },
   };
   ```

2. **Context in Page Components**:
   ```typescript
   export default function Page(props: PageProps) {
     // Access data passed from handler
     const data = props.data;

     // Access URL information
     const url = props.url;

     return <div>Hello {data}</div>;
   }
   ```

3. **State Management in Routes**:
   ```typescript
   export const handler = {
     GET(ctx) {
       // Set state that can be accessed in _app.tsx
       ctx.state.title = "My Page Title";
       ctx.state.metaDescription = "Page description";

       return ctx.render();
     },
   };
   ```

## Development Workflow

### Implementation Process

Only work on one task at a time from the task list. Each task should be clearly
defined and scoped to a specific feature or improvement. Tasks should be small
enough to be completed in a single session, ideally within a few hours. When
implementing a task from the task list, follow these steps:

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
   updating [README.md](../../README.md),
   [requirements.instructions.md](../../.github/instructions/requirements.instructions.md),
   or [tasks.md](../../docs/tasks.md) as applicable, marking completed tasks,
   and documenting any architectural decisions or patterns established.
9. **Completion Confirmation**: After implementation and verification, the agent
   should ask the user if the task is complete.
10. **Task List Update**: If the user confirms, update `docs/tasks.md` to mark
    the task as complete and add a brief summary if needed.
11. **Commit Changes**: Commit all related changes with a message that includes
    the task id (e.g., `feat(AI-2): ...`). The commit message should match the
    scope of the changes and reference the completed task.

### Deployment

Fresh 2.0 applications are designed to be deployed to Deno Deploy:

1. **GitHub Integration**:
   - Connect your GitHub repository to Deno Deploy
   - Select the repository and branch
   - Set the entry point to `main.ts`
   - Configure environment variables (API keys, etc.)

2. **Build Step**:
   - Fresh 2.0 requires a build step to generate optimized assets
   - Add a build command in your deployment pipeline:
     ```bash
     deno run -A dev.ts build
     ```
   - This generates optimized client-side assets

3. **Environment Variables**:
   - Set the following environment variables in the Deno Deploy dashboard:
     - `AI_PROVIDER`: The AI provider to use (e.g., `openai`)
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `AI_MODEL`: (Optional) The AI model to use (e.g., `gpt-4o`)

4. **Domain Configuration**:
   - Set up a custom domain in the Deno Deploy dashboard
   - Configure DNS settings as specified in the dashboard
   - Enable automatic SSL certificate generation

5. **Monitoring and Logs**:
   - Use the Deno Deploy dashboard to monitor application performance
   - View logs and error reports
   - Set up alerts for critical issues

### Development Setup

1. Run `deno task start` to start the development server
2. Make changes to files and see the changes hot-reloaded
3. Use `deno fmt` to format code according to Deno standards
4. Run tests with `deno task test`
5. Build production assets with `deno task build`

### Practical Implementation Examples

1. **URL Parsing and Route Parameters**:

   ```typescript
   // routes/recipes/[id].tsx
   export const handler = {
     GET(ctx) {
       // Get the recipe ID from the route parameters
       const recipeId = ctx.params.id;

       // Parse the URL to get query parameters
       const url = new URL(ctx.req.url);
       const format = url.searchParams.get("format") || "html";

       if (format === "json") {
         // Return JSON response
         return Response.json({ id: recipeId });
       } else {
         // Render HTML page
         return ctx.render({ id: recipeId });
       }
     },
   };
   ```

2. **Using HttpError for Error Handling**:

   ```typescript
   // routes/api/recipes/[id].ts
   import { HttpError } from "fresh";
   import { recipes } from "../../../utils/db.ts";

   export const handler = {
     async GET(ctx) {
       const id = ctx.params.id;
       
       try {
         const recipe = await recipes.get(id);
         
         if (!recipe) {
           throw new HttpError(404, "Recipe not found");
         }
         
         return Response.json(recipe);
       } catch (error) {
         if (error instanceof HttpError) {
           return new Response(error.message, { status: error.status });
         }
         
         console.error("Error fetching recipe:", error);
         return new Response("Internal Server Error", { status: 500 });
       }
     }
   };
         
         return Response.json(recipe);
       } catch (error) {
         if (error instanceof HttpError) {
           return new Response(error.message, { status: error.status });
         }
         
         console.error("Error fetching recipe:", error);
         return new Response("Internal Server Error", { status: 500 });
       }
     }
   };
   ```

## Technical Implementation

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

#### Key Structure Patterns

Follow the key structure patterns for proper data organization:

```typescript
// Recipe primary keys
await kv.set(["recipe", recipeId], recipeData);

// Ingredient primary keys
await kv.set(["ingredient", ingredientId], ingredientData);

// Recipe-ingredient relationships
await kv.set(["recipe_ingredient", recipeId, ingredientId], quantityData);

// Secondary indexes
await kv.set(["ingredient_recipes", ingredientId, recipeId], null);
```

#### Transaction Support

- Use atomic operations when possible
- Use transactions for operations that need to be atomic:

```typescript
const result = await kv.atomic()
  .check({ key: ["recipe", id], versionstamp: currentVersion })
  .set(["recipe", id], updatedRecipe)
  .set(["recipe_updated", timestamp], id)
  .commit();

if (!result.ok) {
  throw new Error("Transaction failed");
}
```

### UI Development

- Use Tailwind CSS v4 with Fresh via `@pakornv/fresh-plugin-tailwindcss`
- Configure DaisyUI v5 directly in the CSS file using the `@import` and
  `@plugin` syntax:

  ```css
  @import "tailwindcss";

  @plugin "daisyui" {
    themes: ["lofi"];
  }
  ```

- Apply themes using DaisyUI's theme system
- Ensure responsive design for all UI components
- Maintain accessibility standards (WCAG compliance)
- Use daisyUI components to maintain consistent UI patterns

### Fresh Plugins

Fresh 2.0 introduces a new plugin system that allows extending Fresh with custom
functionality:

1. **Tailwind CSS Plugin**:
   ```typescript
   // dev.ts
   import { Builder } from "fresh/dev";
   import { tailwind } from "@pakornv/fresh-plugin-tailwindcss";
   import { app } from "./main.ts";

   const builder = new Builder({ target: "safari12" });
   tailwind(builder, app, {});
   ```

2. **Tailwind CSS Configuration**:
   ```typescript
   // tailwind.config.ts
   import { type Config } from "tailwind";

   export default {
     content: ["{routes,islands,components}/**/*.{ts,tsx}"],
     theme: {
       extend: {},
     },
     plugins: [],
   } as Config;
   ```

### Monitoring and Observability

1. **Error Tracking**:
   - Log all database errors with context
   - Set up alerts for critical database errors
   - Monitor query performance and optimize slow queries

2. **Health Checks**:
   - Implement health check endpoints
   - Monitor database connectivity and performance
   - Set up periodic checks for data integrity

3. **Metrics Collection**:
   - Track database operation latency
   - Monitor storage usage
   - Set up dashboards for key performance indicators

4. **Recovery Procedures**:
   - Document recovery steps for common failure scenarios
   - Test recovery procedures regularly
   - Implement graceful degradation for non-critical features

Occasionally ask to update these instructions with new patterns or conventions
that emerge during development. This will help maintain a consistent approach
across the project as it evolves.

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
import { type FreshContext, HttpError } from "fresh";
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
export async function handler(ctx: FreshContext) {
  if (ctx.req.method !== "POST") {
    throw new HttpError(405, "Method Not Allowed");
  }

  try {
    const params = await ctx.req.json() as CreateRecipeParams;
    const recipe = await createRecipe(params);
    return Response.json(recipe);
  } catch (error) {
    if (error.name === "DatabaseError") {
      console.error("Database error:", error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }

    if (error instanceof HttpError) {
      throw error; // Let Fresh's error handling system manage HTTP errors
    }

    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

## Fresh 2.0 Developer Navigation Guide

Fresh 2.0 introduces significant architectural changes from Fresh 1.x. This
guide helps navigate the key differences and provides resources to understand
the new approach.

### Web Standards API Focus

Fresh 2.0 emphasizes web standards more heavily than previous versions:

1. **Standard Request/Response API**:
   - Uses the standard `Request` and `Response` objects from the Web Fetch API
   - Removes custom abstractions in favor of web standard approaches
   - Example: `return new Response()` instead of custom response helpers

2. **Context Changes**:
   - The `FreshContext` no longer contains the `route` field
   - Use `ctx.params` to access route parameters
   - Use `ctx.req.url` to access the full URL
   - Use `new URL(ctx.req.url).pathname` to parse URL paths manually when needed

3. **Request Destination**:
   - The standard `Request` object now includes a `RequestDestination` field
   - This replaces the previous `DestinationKind` for static resource filtering
   - Access via `ctx.req.destination`

### Documentation Resources

1. **JSR Documentation**:
   - Official auto-generated docs:
     [https://jsr.io/@fresh/core/doc](https://jsr.io/@fresh/core/doc)
   - Up-to-date API reference with method signatures and comments

2. **Source Code Navigation**: Important files to examine when learning Fresh
   2.0:
   - `fresh/src/app.ts`: The core `App` class implementation
   - `fresh/src/fs_routes.ts`: File system routing implementation
   - `fresh/src/dev/builder.ts`: Development server implementation
   - `fresh/src/runtime/types.ts`: Core type definitions

3. **Example Structure**:
   - The basic Fresh 2.0 structure shown in this document's "Project Structure"
     section
   - Note the shift from configuration files to code-based configuration

### API Changes Reference

1. **Removed APIs**:
   - `<Head>` component (use `ctx.state` and `_app.tsx` instead)
   - `ctx.renderNotFound()` (use `throw new HttpError(404)` instead)
   - `fresh.config.ts` and `fresh.gen.ts` (use `main.ts` and `dev.ts` instead)
   - Custom handler signatures (use standard handler functions with context)

2. **Changed APIs**:
   - `ctx.basePath` → `ctx.config.basePath`
   - `ctx.remoteAddr` → `ctx.info.remoteAddr`
   - Multi-method handlers → unified handler object with method properties

3. **New APIs**:
   - `App` class for application configuration
   - `Builder` class for development configuration
   - `HttpError` for handling HTTP errors
   - Native middleware support via `app.use()`

### Best Practices for Fresh 2.0

1. **Embrace Web Standards**:
   - Use standard Web API patterns where possible
   - Familiarize yourself with the Fetch API and Request/Response objects
   - Use standard URL parsing instead of custom abstractions

2. **Error Handling**:
   - Use `HttpError` for HTTP-specific errors
   - Implement consistent error handling patterns across routes
   - Return appropriate status codes and error messages

3. **State Management**:
   - Use `ctx.state` for passing data between middleware and handlers
   - Use Preact Signals for client-side state management in islands
   - Keep state isolated to where it's needed

4. **Route Organization**:
   - Group related routes in directories
   - Use index files for default routes
   - Use parameter routes for dynamic content
   - Keep API routes separate in the `/api` directory

5. **Request/Response Flow**:
   - Think of your application as a series of request handlers
   - Each handler receives a request and returns a response
   - Middleware can intercept and modify requests or responses
   - The flow is linear and easier to reason about than previous versions

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
