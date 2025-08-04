# Barsistant

Barsistant is a web application designed to store and provide easy lookup of
cocktail recipes with AI-powered recipe extraction capabilities.

## Features

- **Recipe Management**: Create, search, and organize cocktail recipes
- **AI Recipe Extraction**: Automatically extract recipes from URLs (websites,
  YouTube videos, blogs)
- **AI Image Generation**: Create beautiful cocktail images with OpenAI and
  vector (SVG) images with recraft.ai
- **Magic Link Authentication**: Secure passwordless authentication via email
- **Admin Mode**: Admin interface for recipe management and system
  administration
- **Ingredient Tracking**: Manage your home bar inventory
- **Recipe Discovery**: Find cocktails based on available ingredients
- **Personalization**: Save favorites and add personal notes to recipes

## Technology Stack

- **Framework**: [Fresh](https://fresh.deno.dev/) - Full-stack web framework for
  Deno
- **UI Components**: [Preact](https://preactjs.com/) and
  [daisyUI](https://daisyui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Runtime**: [Deno](https://deno.land/)
- **Database**: [Deno KV](https://deno.com/kv) - Built-in key-value database
- **Dependency Management**: [JSR](https://jsr.io/) - JavaScript Registry for
  modern package imports
- **AI Integration**: AI SDK for recipe extraction
- **Deployment**: [Deno Deploy](https://deno.com/deploy)

## Getting Started

### Prerequisites

Make sure to install Deno: https://deno.land/manual/getting_started/installation

### Environment Setup

Copy the provided `.env.example` file to `.env` in the root directory and fill
in your values:

```bash
cp .env.example .env
```

Then edit the `.env` file with your specific configuration:

```dotenv
# AI Provider settings
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here

# Authentication & Email Configuration
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com  # optional
FROM_NAME=Your App Name            # optional

# Admin Configuration (optional)
ADMIN_EMAIL=admin@yourdomain.com   # Email address for admin access

# Optional: Recraft.ai integration for vector images
RECRAFT_API_TOKEN=your_recraft_api_token_here
RECRAFT_MODEL=recraftv3  # or recraftv2

# S3 Storage for images
S3_ENDPOINT=https://your-s3-endpoint.com
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=your_bucket_name
S3_REGION=us-east-1

# Database Migrations (optional settings)
# DISABLE_MIGRATIONS=false
# AUTO_MIGRATE=true
# ROLLBACK_ON_ERROR=true
# APPROVED_DANGEROUS_MIGRATIONS=migration_name1,migration_name2
```

### Running the Application

Start the development server:

```bash
deno task dev
```

The application will be available at `http://localhost:8000`.

You can also use the production server locally (it will still load .env file in
non-production environments):

```bash
deno task build  # Build the app first
deno task start   # Then start the production server
```

Note: The .env file is automatically loaded in development but not in production
deployments.

### Database Migrations

Barsistant includes a database migration system for managing changes to the
database schema and data. The migrations will automatically run on application
startup (configurable).

To create a new migration:

```bash
deno task migration:create migration_name "Description of the migration"
```

To check migration status:

```bash
deno task migration:status
```

To run pending migrations:

```bash
deno task migration:run
```

For more details, see [Database Migration System](docs/migrations.md).

### Running Tests

Always run tests using the configured task to ensure proper permissions and
flags:

```bash
deno task test
```

To run a specific test file or directory:

```bash
deno task test path/to/test/file.ts
```

> Note: Deno KV is currently an unstable API, so the `--unstable-kv` flag is
> required to run the application and tests. This has been configured in the
> [deno.json](deno.json) task definitions along with other necessary
> permissions.

## Environment Variables

Barsistant requires a `.env` file in the project root for provider-agnostic AI
integration. The `.env.example` file provides a template with all required and
optional variables.

- `AI_PROVIDER`: The AI provider to use (e.g. `openai`, `anthropic`).
- `OPENAI_API_KEY`: The API key for the selected provider. This is required for
  all AI features.
- `AI_MODEL`: (Optional) The model to use for the selected provider (e.g.
  `gpt-4o`, `gpt-4`, `claude-3-opus-20240229`). Defaults to `gpt-4o` for OpenAI
  if not set.

To get started quickly:

```bash
cp .env.example .env
```

Then edit the `.env` file with your specific values before running the app or
tests.

## Authentication Configuration

Barsistant uses magic link authentication powered by Resend for email delivery.
To enable authentication:

### Required Environment Variables:

- `RESEND_API_KEY`: Your Resend API key for sending magic link emails

### Optional Environment Variables:

- `FROM_EMAIL`: Email address for sending magic links (default:
  `hello@barsistant.com`)
- `FROM_NAME`: Display name for emails (default: `Barsistant`)

### Setting up Resend:

1. Sign up for a free account at [resend.com](https://resend.com)
2. Create an API key in your Resend dashboard
3. Add the API key to your `.env` file as `RESEND_API_KEY`
4. (Optional) Configure a custom domain for professional emails

### Authentication Features:

- **Passwordless Login**: Users sign in via magic links sent to their email
- **Rate Limiting**: Protection against spam and abuse
- **Session Management**: Secure session handling with HttpOnly cookies
- **Security**: CSRF protection, bot detection, and secure headers

## Admin Configuration

Barsistant includes an admin mode for recipe management and system
administration. Admin access is controlled by a single environment variable.

### Setting up Admin Access:

1. Set the `ADMIN_EMAIL` environment variable to the email address that should
   have admin privileges:
   ```bash
   ADMIN_EMAIL=admin@yourdomain.com
   ```

2. Sign in with the specified email using the normal magic link authentication

3. Once signed in, admin users will see an "Admin" link in their user dropdown
   and mobile navigation dock

### Admin Features:

- **Recipe Management**: View, search, and delete recipes
- **Mobile-Responsive Interface**: Card-based layout on mobile, table on desktop
- **Comprehensive Data Cleanup**: Recipe deletion removes all associated user
  favorites and notes
- **Search and Pagination**: Efficiently manage large numbers of recipes
- **Audit Logging**: All admin actions are logged for security

### Admin Routes:

- `/admin` - Admin dashboard
- `/admin/recipes` - Recipe management interface

### Security:

- Admin access is restricted to the single email specified in `ADMIN_EMAIL`
- All admin routes require both authentication and admin verification
- Atomic database operations ensure data consistency during deletions

## S3 Image Upload Configuration

To enable AI-generated cocktail image uploads, set the following environment
variables:

- `S3_ENDPOINT`: The S3-compatible endpoint URL (e.g.,
  `https://s3.amazonaws.com` or your MinIO/Supabase endpoint)
- `S3_ACCESS_KEY_ID`: Your S3 access key ID
- `S3_SECRET_ACCESS_KEY`: Your S3 secret access key
- `S3_BUCKET`: The bucket name to store images
- `S3_REGION`: (Optional) The S3 region (default: us-east-1)

These variables are already included in the `.env.example` template. For local
development, fill them in your `.env` file. For production, set these variables
in your deployment environment.

## Development Tools

### GitHub MCP for Claude Code

This project includes MCP (Model Context Protocol) configuration for enhanced GitHub integration when using Claude Code. The `.mcp.json` file configures the GitHub MCP server to enable Claude Code to interact directly with this GitHub repository.

#### Setup for Developers

To enable GitHub MCP features in Claude Code:

1. Create a GitHub Personal Access Token with access to this repository:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens (recommended)
   - Create a token with access to this specific repository
   - Grant permissions for: Contents, Issues, Pull requests, Metadata

2. Set the environment variable:
   ```bash
   export GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here
   ```

3. Ensure Docker is running (the MCP server runs in a container)

This enables Claude Code to create issues, manage pull requests, search code, and perform other GitHub operations directly within this repository from the development environment.

## Project Structure

- `/routes` - Page components and API endpoints
- `/components` - Reusable UI components
- `/utils` - Shared utility functions and database utilities
  - [`utils/db.ts`](utils/db.ts) - Database connection and helper functions
- `/static` - Static assets

## Database Usage

The application uses Deno KV as its database solution. A utility module at
[`utils/db.ts`](utils/db.ts) provides:

- Centralized database connection management
- Error handling with retry logic
- Helper functions for common operations
- Type definitions for key patterns

Example usage:

```typescript
import { ingredients, kv, recipes } from "../utils/db.ts";

// Recipe operations
const recipe = await recipes.get("old-fashioned");
const bourbonRecipes = recipes.listByIngredient("bourbon");

// Ingredient operations
import { ingredientModel } from "../utils/ingredient-model.ts";

// Create a new ingredient
const newIngredient = await ingredientModel.create({
  name: "Angostura Bitters",
  description: "Aromatic bitters used in many classic cocktails",
  type: "bitters",
  allergens: ["gentian"],
});

// Get ingredient by ID
const ingredient = await ingredientModel.getById("some-ingredient-id");

// Search for ingredients
const bittersList = await ingredientModel.search({
  types: ["bitters"],
  limit: 10,
});

// Update an ingredient
await ingredientModel.update("some-ingredient-id", {
  description: "Updated description",
});

// Delete an ingredient
await ingredientModel.delete("some-ingredient-id");
```

## Documentation

Key documentation files:

- [Project Requirements](.github/instructions/requirements.instructions.md)
- [AI Development Instructions](.github/instructions/project.instructions.md)
- [Implementation Tasks](docs/tasks.md)

## Contributing

1. Review the
   [Project Requirements](.github/instructions/requirements.instructions.md) and
   [Implementation Tasks](docs/tasks.md)
2. Follow the coding guidelines in
   [AI Development Instructions](.github/instructions/project.instructions.md)
3. Test your changes thoroughly

## License

This project is licensed under the terms of the license included in the
[LICENSE](LICENSE) file.

## Development Setup

### UI Framework

The project uses Fresh with Tailwind CSS v4 and DaisyUI v5:

1. Fresh's Tailwind plugin is configured via `@pakornv/fresh-plugin-tailwindcss`
2. DaisyUI themes are configured directly in
   [`static/styles.css`](static/styles.css):

   ```css
   @import "tailwindcss";

   @plugin "daisyui" {
     themes: ["lofi"];
   }
   ```
