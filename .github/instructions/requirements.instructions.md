---
applyTo: '**'
---

# Barsistant Project Requirements

## Purpose & Scope

Barsistant is a web app for storing, searching, and extracting cocktail recipes,
with AI-powered extraction from URLs (websites, YouTube, blogs). It supports
inventory tracking, favorites, and recipe discovery.

## Core Functional Requirements

- Search cocktail recipes by name, ingredient, or characteristics
- Add new recipes manually or via AI extraction from URLs
- Save favorite recipes and add personal notes
- Organize recipes by categories (type, base spirit, flavor, etc.)
- Adjust recipe portions/serving sizes
- Maintain a digital inventory of bar ingredients
- Filter recipes by available ingredients

## Non-Functional Requirements

- Recipe search results load in <2s
- AI extraction completes in <30s
- UI is intuitive and mobile-friendly
- System uptime ≥99%
- All user data is securely stored and encrypted
- All code is thoroughly tested with automated tests
- Test coverage for critical functionality is ≥85%
- All tests must pass before any feature is considered complete

## Key Features (Implemented or In Progress)

- Recipe CRUD (create, read, update, delete)
- Ingredient CRUD and inventory tracking
- AI recipe extraction (web/YouTube)
- User favorites and notes
- Responsive, accessible UI (WCAG compliant)
- Deno KV for all data storage (see utils/db.ts)
- Provider-agnostic AI SDK integration

## Technology Stack

- Fresh (Deno web framework)
- Preact + DaisyUI + Tailwind CSS
- Deno KV (database)
- JSR for dependency management
- Deployed on Deno Deploy

## Security & Safety

- Secure authentication (magic links)
  - Magic link authentication should open the app directly in the Barsistant PWA
    when possible, for a seamless user experience.
- Protection against XSS, CSRF, SQL Injection

## Performance

- Support 1,000+ concurrent users
- DB response <100ms for recipe queries
- Optimized images for fast loading

## Quality Assurance & Testing

- All features must have automated tests
- Backend logic requires unit and integration tests
- UI changes require visual verification and basic functional tests
- New database models require CRUD operation tests
- Tests must use proper permissions via `deno task test`
- No feature can be considered complete without passing tests
- Tests should verify both success and error paths
- Regression tests are required for bug fixes

## Reference & Documentation

- See README.md for setup, environment, and stack
- See docs/tasks.md for current and completed tasks
- See types/ for data models
- See utils/db.ts for database access patterns
- See static/styles.css and tailwind.config.ts for UI conventions

## Appendix (Reference Only)

- Timeline, budget, and stakeholders: see project docs if needed

---

_This document is a living summary. For full details, see the referenced files
and docs. Remove or update requirements here as features are completed or
superseded._
