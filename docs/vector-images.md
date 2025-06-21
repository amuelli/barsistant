# Vector Image Generation for Cocktail Recipes

This document explains the vector image generation feature in Barsistant which
uses recraft.ai to create high-quality, scalable SVG images for cocktails.

## Overview

Traditional raster images (PNG, JPG) don't scale well and can appear pixelated
at different resolutions. Vector images (SVG) maintain perfect quality at any
scale, which is particularly valuable for a responsive web application.

Barsistant now supports generating vector images for cocktail recipes using
recraft.ai, a specialized AI service for vector illustration generation.

## Implementation Details

The vector image generation system includes:

1. **Recraft.ai Integration** (`utils/ai/recraft.ts`)
   - Connects to the recraft.ai API
   - Generates new vector illustrations based on recipe details
   - Can vectorize existing raster images

2. **Background Processing** (`utils/db/recipe-vector-image-job.ts`)
   - Asynchronously handles vector image generation via Deno KV Queues
   - Prevents blocking the main application flow
   - Includes fallback to raster images if vector generation fails

3. **Queue Handler Integration** (`utils/db/queue-handler.ts`)
   - Listens for both raster and vector image generation jobs
   - Processes jobs in the background

4. **Helper Utilities** (`utils/db/recipe-vector.ts`)
   - Provides functions to enhance recipes with vector images
   - Includes batch upgrading capability for existing recipes

## Advantages of Vector Images

- **Perfect scaling** at any screen size or zoom level
- **Smaller file size** for simple illustrations
- **Accessibility benefits** with precise rendering
- **Better printing quality** for recipe cards or printouts
- **Simplified design aesthetic** that fits modern UI standards

## Configuration

To use vector image generation:

1. Add your recraft.ai API key to the environment configuration:

   ```env
   RECRAFT_API_TOKEN=your_api_token_here
   RECRAFT_MODEL=recraftv3  # or recraftv2
   ```

2. Ensure your S3 storage is properly configured:

   ```env
   S3_ENDPOINT=https://your-s3-endpoint
   S3_ACCESS_KEY_ID=your_access_key
   S3_SECRET_ACCESS_KEY=your_secret_key
   S3_BUCKET=your_bucket_name
   S3_REGION=us-east-1  # or your preferred region
   ```

## Usage

### Generate Vector Images for New Recipes

Vector image generation happens automatically in the background after a recipe
is created if the `RECRAFT_API_TOKEN` is configured.

### Upgrade Existing Recipes to Vector

Use the provided script to upgrade existing recipes:

```bash
deno run --allow-env --allow-net --allow-read --unstable-kv scripts/upgrade-to-vector.ts
```

### Programmatic Usage

```typescript
import { enqueueVectorImageGeneration } from "./utils/db/recipe-vector.ts";

// Generate a vector image for a specific recipe
await enqueueVectorImageGeneration("recipe-id-here");
```

## Considerations

- Recraft.ai API has usage limits and costs (vector images are ~2x the cost of
  raster images)
- Vector generation is optimized for simple, iconic cocktail illustrations, not
  photorealistic images
- The system falls back to OpenAI raster images if vector generation fails
