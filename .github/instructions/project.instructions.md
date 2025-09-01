---
applyTo: "**"
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

### Preact Signals Guidelines

**CRITICAL**: Always use `useSignal()` hook in islands/components, never
`signal()`

```typescript
// ✅ CORRECT - Use in islands/components
import { useSignal } from "@preact/signals";
const state = useSignal({ value: initialValue });

// ❌ WRONG - This won't trigger re-renders in components
import { signal } from "@preact/signals";
const state = signal({ value: initialValue });
```

- `useSignal()` - Use in Preact components/islands for reactive state
- `signal()` - Use only for global state outside components
- Always access signal values with `.value` in JSX: `{state.value.property}`
- Don't compute derived values outside JSX - access `state.value` directly in
  render

## Development Workflow

**IMPORTANT**: All development MUST follow the GitHub issue-based workflow:

### Issue-First Development Process:

1. **Plan First, Then Create GitHub Issue**: Before any development work
   - Formulate comprehensive plan using TodoWrite tool and code analysis
   - Research existing code patterns and dependencies
   - Define TypeScript types and interfaces
   - Use `mcp__github__create_issue` to create detailed issue documenting the
     plan
   - Include scope, acceptance criteria, implementation approach, testing
     requirements based on your analysis
   - Apply appropriate labels (feature, bug, enhancement, docs)
   - Reference any related issues or dependencies

2. **Create Feature Branch**: Always branch from main using local git
   - Use local git commands with naming: `feature/123-brief-description`
   - Branch name MUST include issue number
   - Examples: `feature/45-recipe-search`, `fix/67-auth-bug`,
     `improvement/89-db-performance`
   - Commands:
     ```bash
     git checkout main
     git pull origin main
     git checkout -b feature/123-brief-description
     ```

3. **Development Implementation**:
   - Work on one issue at a time
   - Plan before coding; start with types, then implement core logic
   - Add error handling and inline documentation
   - Integrate with existing code
   - Make regular commits referencing issue number (e.g., "feat: add search
     functionality (#45)")

4. **Testing & Quality Assurance (MANDATORY)**:
   - Write unit tests for all backend/logic components
   - Use Browser MCP for UI verification when applicable
   - ALWAYS run the full test suite using `deno task test` before considering
     work complete
   - Fix any failing tests before proceeding
   - This is a critical step and cannot be skipped under any circumstances
   - Tests must pass with the correct permissions and environment settings

5. **Pre-Pull Request Verification**:
   - ✓ All code is implemented according to issue requirements
   - ✓ All tests are passing (`deno task test`)
   - ✓ All lint checks are passing (`deno task check`)
   - ✓ Documentation is updated as needed
   - ✓ No TypeScript errors or warnings
   - ✓ Feature branch is pushed to remote repository:
     ```bash
     git push -u origin feature/123-brief-description
     ```

6. **Pull Request Creation**:
   - Use `mcp__github__create_pull_request` to create PR
   - Link to issue with "Closes #123" or "Fixes #123" in description
   - Include comprehensive testing verification in PR description
   - PR title should clearly describe what was accomplished

7. **Completion**: Only after PR is created and verified complete

### Legacy Task Management:

- docs/tasks.md is supplementary for additional context
- Primary tracking should happen through GitHub issues
- Keep any task descriptions in docs/tasks.md short and concise

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

**IMPORTANT**: All commits MUST reference GitHub issue numbers:

### Format with Issue References:

- Use conventional commit format with issue number: `type: description (#123)`
- Examples:
  - `feat: implement recipe search functionality (#45)`
  - `fix: resolve authentication session bug (#67)`
  - `refactor: optimize database query performance (#89)`
  - `docs: update API documentation (#101)`
  - `test: add unit tests for recipe service (#112)`

### Alternative Formats (when applicable):

- For work-in-progress: `feat: add search UI components (ref #45)`
- For partial fixes: `fix: partially resolve auth issue (ref #67)`
- For multiple issues: `feat: implement search and filters (#45, #67)`

### Commit Types:

- `feat`: New features
- `fix`: Bug fixes
- `refactor`: Code refactoring without functional changes
- `docs`: Documentation updates
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates
- `style`: Code formatting, whitespace changes
- `perf`: Performance improvements

### Commit Body (optional):

- List additional details as bullet points below the title if needed
- Example:
  ```text
  feat: implement recipe search functionality (#45)

  - Add full-text search across recipe names and ingredients
  - Implement search result pagination
  - Add search filters for dietary restrictions
  ```

### Legacy Format (deprecated):

- Old format with task IDs: `feat(AI-3): implement ai provider`
- Only use when working with legacy docs/tasks.md items
- Transition to GitHub issue references for all new work

## Reference

- See README.md for setup, stack, and conventions
- See docs/tasks.md for task status
- See types/ for data models
- See utils/db.ts for DB patterns
- See static/styles.css and tailwind.config.ts for UI

---

_This document is a living summary. Update as new patterns or conventions
emerge. For full details, see referenced files and docs._
