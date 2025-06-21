# Barsistant

Barsistant is a web application designed to store and provide easy lookup of
cocktail recipes with AI-powered recipe extraction capabilities.

## Features

- **Recipe Management**: Create, search, and organize cocktail recipes
- **AI Recipe Extraction**: Automatically extract recipes from URLs (websites,
  YouTube videos, blogs)
- **AI Image Generation**: Create beautiful cocktail images with OpenAI and
  vector (SVG) images with recraft.ai
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

Create a `.env` file in the root directory with the following variables:

```
# AI Provider settings
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Recraft.ai integration for vector images
RECRAFT_API_TOKEN=your_recraft_api_token_here
RECRAFT_MODEL=recraftv3  # or recraftv2

# S3 Storage for images
S3_ENDPOINT=https://your-s3-endpoint.com
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=your_bucket_name
S3_REGION=us-east-1
```

### Running the Application

Start the development server:

```bash
deno task start
```

Or use the watch mode for development:

```bash
deno task start
```

The application will be available at `http://localhost:8000`.

### Running Tests

Run the test suite with:

```bash
deno task test
```

> Note: Deno KV is currently an unstable API, so the `--unstable-kv` flag is
> required to run the application and tests. This has been configured in the
> [deno.json](deno.json) task definitions.

## Environment Variables

Barsistant requires a `.env` file in the project root for provider-agnostic AI
integration. See `.env.example` for a template.

- `AI_PROVIDER`: The AI provider to use (e.g. `openai`, `anthropic`).
- `OPENAI_API_KEY`: The API key for the selected provider. This is required for
  all AI features.
- `AI_MODEL`: (Optional) The model to use for the selected provider (e.g.
  `gpt-4o`, `gpt-4`, `claude-3-opus-20240229`). Defaults to `gpt-4o` for OpenAI
  if not set.

No setup script is required—just copy `.env.example` to `.env` and fill in your
values before running the app or tests.

## S3 Image Upload Configuration

To enable AI-generated cocktail image uploads, set the following environment
variables:

- `S3_ENDPOINT`: The S3-compatible endpoint URL (e.g., https://s3.amazonaws.com
  or your MinIO/Supabase endpoint)
- `S3_ACCESS_KEY_ID`: Your S3 access key ID
- `S3_SECRET_ACCESS_KEY`: Your S3 secret access key
- `S3_BUCKET`: The bucket name to store images
- `S3_REGION`: (Optional) The S3 region (default: us-east-1)

For local development, copy `.env.example` to `.env` and fill in your values.
For production, set these variables in your deployment environment.

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
