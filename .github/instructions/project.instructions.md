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

## Development Workflow
1. Work on one task at a time (see docs/tasks.md)
2. Plan before coding; start with types, then implement core logic
3. Add error handling and inline documentation
4. Integrate with existing code and test thoroughly
5. Use Browser MCP for UI verification, write unit tests for backend/logic
6. Update docs as needed (README.md, docs/tasks.md, etc.)
7. After user confirms completion, mark the task as done in docs/tasks.md and commit with a descriptive message
- Keep task descriptions in docs/tasks.md short and concise. If more detail is needed, add it to project.instructions.md or another appropriate documentation file.

## Technical Implementation
- Use utils/db.ts for all Deno KV operations
- Follow key structure and transaction patterns in utils/db.ts
- Use provider-agnostic AI SDK for extraction (see utils/ai-provider.ts)
- UI: Use Tailwind CSS and DaisyUI (see static/styles.css, tailwind.config.ts)
- Ensure accessibility and responsive design

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

## Reference
- See README.md for setup, stack, and conventions
- See docs/tasks.md for task status
- See types/ for data models
- See utils/db.ts for DB patterns
- See static/styles.css and tailwind.config.ts for UI

---

*This document is a living summary. Update as new patterns or conventions emerge. For full details, see referenced files and docs.*
