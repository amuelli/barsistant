# Barsistant

Barsistant is a web application designed to store and provide easy lookup of
cocktail recipes with AI-powered recipe extraction capabilities.

## Features

- **Recipe Management**: Create, search, and organize cocktail recipes
- **AI Recipe Extraction**: Automatically extract recipes from URLs (websites,
  YouTube videos, blogs)
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
- **AI Integration**: AI SDK for recipe extraction
- **Deployment**: [Deno Deploy](https://deno.com/deploy)

## Getting Started

### Prerequisites

Make sure to install Deno: https://deno.land/manual/getting_started/installation

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```
AI_API_KEY=your_api_key_here
```

### Running the Application

Start the development server:

```bash
deno task start
```

Or use the watch mode for development:

```bash
deno run -A dev.ts
```

The application will be available at `http://localhost:8000`.

## Project Structure

- `/routes` - Page components and API endpoints
- `/components` - Reusable UI components
- `/utils` - Shared utility functions
- `/models` - Database models and operations
- `/types` - TypeScript type definitions
- `/static` - Static assets

## Documentation

Additional documentation can be found in the `/docs` directory:

- [Requirements Document](docs/requirements.md)
- [Implementation Tasks](docs/tasks.md)
- [AI Instructions](docs/ai_instructions.md)

## Contributing

1. Review the [requirements document](docs/requirements.md) and
   [tasks list](docs/tasks.md)
2. Follow the coding guidelines in [AI instructions](docs/ai_instructions.md)
3. Test your changes thoroughly

## License

This project is licensed under the terms of the license included in the
[LICENSE](LICENSE) file.
