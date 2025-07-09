# Barsistant - AI Assistant Context

This file provides context for AI assistants working on the Barsistant project.

## 🔗 Core Instructions

**IMPORTANT**: Before working on this project, read the following instruction files:

1. **[Project Instructions](/.github/instructions/project.instructions.md)** - Development conventions, workflow, testing requirements, and technical implementation patterns
2. **[Requirements](/.github/instructions/requirements.instructions.md)** - Functional requirements, non-functional requirements, technology stack, and quality standards
3. **[README](/README.md)** - Project overview, setup instructions, and environment configuration

These files contain the **primary** development guidelines. This CLAUDE.md file supplements them with context-specific information.

## 🏗️ Project Overview

Barsistant is a smart cocktail recipe assistant built with Fresh (Deno) and TypeScript. It helps users discover, create, and manage cocktail recipes with AI-powered features including magic link authentication, recipe extraction from URLs, and AI-generated recipe images.

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

## 🛠️ Architecture Patterns

### State Management

- **Props over Context**: Pass user state as props instead of React Context (Fresh islands don't share context reliably)
- **Server-side state**: User authentication state comes from `/_middleware.ts`
- **Client-side signals**: Use Preact signals for UI state in islands

### Key Components

- **AuthNav** (`/islands/AuthNav.tsx`): Shows sign-in button or user dropdown
- **Mobile dock**: Bottom navigation with authentication-aware buttons
- **Profile page**: User information and preferences management

## 📁 Important Files & Patterns

### Authentication Files

- `/_middleware.ts` - Sets `ctx.state.user` for all requests
- `/utils/auth/middleware.ts` - Auth helper functions (`requireAuth`, `optionalAuth`)
- `/utils/auth/session.ts` - Session management with Deno KV
- `/utils/auth/user.ts` - User CRUD operations

### Email Configuration

- `/utils/email/service.ts` - Resend integration (default: `hello@barsistant.com`)
- `/utils/email/templates.ts` - Magic link and welcome email templates

### UI Patterns

- Use DaisyUI components for consistency
- All buttons must have `type="button"` attribute
- Follow existing patterns in RecipeExtractor for API requests

## 🔧 Development Workflow

1. **Read the instruction files** (linked above)
2. **Run tests**: `deno task test` (MANDATORY before completion)
3. **Check code quality**: `deno task check` (formatter, linter, type checker)
4. **Follow conventions** from project.instructions.md
5. **Test thoroughly** - authentication flows, mobile experience, error cases

## 🚨 Critical Reminders

- **NO PASSWORDS**: This is a magic link only system
- **Props not Context**: Pass user state via props in Fresh
- **Test everything**: All tests must pass before completion
- **Mobile-first**: Consider dock navigation and responsive design
- **Security**: Magic links, HTTP-only cookies, no password fields

## 📝 Recent Authentication Work

- ✅ Magic link authentication fully implemented
- ✅ Server-side session management with cookies
- ✅ AuthNav component with proper state handling
- ✅ Mobile dock navigation with auth-aware buttons  
- ✅ Profile page with user information display
- ✅ Email sender updated to `hello@barsistant.com`

## 🔗 Quick Reference

- **Instructions**: `.github/instructions/` (PRIMARY source of truth)
- **Setup**: **[README.md](/README.md)**
- **Tasks**: **[docs/tasks.md](/docs/tasks.md)**  
- **Types**: `types/` directory
- **Database**: `utils/db/` patterns
- **Testing**: `deno task test` (required)

---

For detailed development guidelines, testing requirements, and conventions, see the instruction files in `.github/instructions/`.
