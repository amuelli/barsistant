# AI Recipe Extraction Feature Documentation

The AI Recipe Extraction feature in Barsistant allows users to extract cocktail
recipe information from web pages using artificial intelligence. This document
explains how the feature works and how to use it.

## Overview

The Recipe Extraction feature uses OpenAI's API to analyze content from cocktail
recipe websites and extract structured recipe information. The extraction
process follows these steps:

1. User provides a URL to a cocktail recipe
2. System fetches content from the URL
3. AI analyzes the content and extracts recipe information
4. User verifies and edits the extracted information
5. User saves the verified recipe to the database

## Setup

Before using the Recipe Extraction feature, you need to configure your OpenAI
API key:

1. Run the setup script:

```bash
deno task setup-ai
```

2. Enter your OpenAI API key when prompted

3. The script will save your API key to the `.env` file

## Usage

1. Navigate to the Extract Recipe page at `/extract`

2. Enter a URL to a cocktail recipe website in the input field

3. Click "Extract Recipe" to start the extraction process

4. Wait for the AI to analyze the content and extract the recipe information

5. Review the extracted recipe information:
   - Check the recipe name, description, and instructions
   - Verify ingredients, quantities, and units
   - Make any necessary edits

6. Click "Save Recipe" to save the final version to your recipe database

## Technical Implementation

The Recipe Extraction feature consists of several components:

1. **URL Content Fetcher** - Fetches and preprocesses content from web pages
   - Handles different content sources (websites)
   - Cleans and prepares content for AI analysis

2. **AI Provider** - Integrates with OpenAI's API
   - Sends content to the API with appropriate prompts
   - Processes structured responses

3. **Recipe Extraction Parser** - Converts AI output to structured recipe data
   - Maps extracted fields to appropriate database fields
   - Validates and normalizes ingredient information

4. **Verification Interface** - Allows users to review and edit extraction
   results
   - Displays confidence scores for the extraction
   - Provides editing capabilities for all recipe components

## Limitations

The current implementation has a few limitations:

1. Some complex recipe formats may not be extracted accurately
2. API rate limits apply based on your OpenAI subscription
3. Extraction quality depends on the clarity and structure of the source content
4. YouTube extraction relies on video descriptions, not actual video content

## Troubleshooting

If you encounter issues with the recipe extraction:

1. **"API key not found" error** - Run `deno task setup-ai` to configure your
   API key

2. **Extraction fails or timeouts** - The source website might be blocked or too
   complex

3. **Poor extraction quality** - Try a different source or manually edit the
   extracted recipe

4. **Website access errors** - Ensure the URL is accessible and not behind a
   login/paywall
