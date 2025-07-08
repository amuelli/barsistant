---
applyTo: '**'
---

# Barsistant AI Development Instructions (Trimmed)

## Key Conventions

- Use TypeScript with explicit type annotations
- Follow Deno and Fresh 2.0 conventions (see README.md)
- Use JSR imports (see deno.json)
- Use async/await, prioritize readability
- Use Preact with Signals for UI state
- Keep UI and business logic separated
- Store shared types in /types
- Place API routes in /routes/api, utilities in /utils
- when removing code, don't leave any traces or comments that it was removed,
  just remove it completely

## Development Workflow

1. Work on one task at a time (see docs/tasks.md)
2. Plan before coding; start with types, then implement core logic
3. Add error handling and inline documentation
4. Integrate with existing code
5. Write and run tests (MANDATORY)
   - Write unit tests for all backend/logic components
   - Use Browser MCP for UI verification when applicable
   - ALWAYS run the full test suite using `deno task test` before considering a
     task complete
   - Fix any failing tests before proceeding
   - This is a critical step and cannot be skipped under any circumstances
   - Tests must pass with the correct permissions and environment settings
6. Update docs as needed (README.md, docs/tasks.md, etc.)
7. Perform a final verification checklist:
   - ✓ All code is implemented
   - ✓ All tests are passing (`deno task test`)
   - ✓ All lint checks are passing (`deno task check`)
   - ✓ Documentation is updated
   - ✓ No TypeScript errors or warnings
8. Only after completing steps 1-7 and receiving user confirmation, mark the
   task as done in docs/tasks.md and commit with a descriptive message

- Keep task descriptions in docs/tasks.md short and concise. If more detail is
  needed, add it to project.instructions.md or another appropriate documentation
  file.

## Technical Implementation

- Use utils/db.ts for all Deno KV operations
- Follow key structure and transaction patterns in utils/db.ts
- Use provider-agnostic AI SDK for extraction (see utils/ai-provider.ts)
- UI: Use Tailwind CSS and DaisyUI (see static/styles.css, tailwind.config.ts)
- Ensure accessibility and responsive design

## Testing and Quality Assurance Requirements

- Write comprehensive tests for all new functionality
- Test coverage should include:
  - Unit tests for utility functions and core logic
  - Integration tests for database operations
  - Basic UI tests for components
- Follow Test-Driven Development (TDD) principles when appropriate
- Use mock data and test fixtures to isolate test cases
- Verify edge cases and error handling paths
- Run the following commands before considering any implementation complete:
  - `deno task test` - Verify all tests are passing
  - `deno task check` - Verify all lint checks are passing
- DO NOT mark a task as complete until ALL tests AND lint checks pass
- Address any warnings, not just errors, from both tests and linting

## Error Handling & Security

- Use specific error types/messages
- Sanitize and validate all user input
- Use environment variables for secrets
- Implement permission checks for protected operations
- Follow secure coding practices (XSS, CSRF, SQLi prevention)

## Performance

- Avoid unnecessary DB queries
- Use caching and pagination where needed
- Optimize UI rendering

## Commit Message Guidelines

- Use a short, descriptive title with a prefix and task ID in brackets:
  - `feat(AI-3): implement ai provider`
  - `fix(DB-2): correct recipe model bug`
  - `refactor(UI-5): update recipe form layout`
  - `doc(README): update setup instructions`
- Prefixes: `feat`, `fix`, `refactor`, `doc`, `test`, etc.
- List additional details as bullet points in the body below the title, if
  needed.
- Example:

  ```text
  feat(AI-3): implement ai provider

  - Add provider-agnostic AI SDK integration
  - Update environment variable docs
  ```

## Reference

- See README.md for setup, stack, and conventions
- See docs/tasks.md for task status
- See types/ for data models
- See utils/db.ts for DB patterns
- See static/styles.css and tailwind.config.ts for UI

---

_This document is a living summary. Update as new patterns or conventions
emerge. For full details, see referenced files and docs._
