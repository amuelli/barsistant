# Recipe Extraction Evaluation

This document describes the recipe extraction evaluation system used to test and
validate the AI extraction pipeline.

## Overview

The extraction evaluation system is designed to test the recipe extraction
pipeline on real-world cocktail recipes. It compares the extracted structured
data against expected results to evaluate:

1. Ingredient normalization (using generic names rather than specific brands)
2. Brand/variety information moved to ingredient notes
3. Completeness of recipe data extraction
4. Accuracy of recipe steps, garnishes, etc.

## Example Recipe Used for Testing

The primary test case is the **Mosquito by Sam Ross** recipe from Difford's
Guide, which contains:

- Branded ingredients (Del Maguey Vida Mezcal)
- Specialized ingredients (Strucchi Red Bitter)
- Specific preparation methods
- Custom garnish details

## Running the Evaluation

To evaluate the recipe extraction pipeline, run:

```bash
# Using deno task
deno task eval-extraction

# Or directly with deno run
deno run -A scripts/eval-extraction.ts
```

The evaluation uses pre-processed HTML saved from a real website, ensuring
realistic testing while avoiding network dependencies during evaluation.

## Updating Evaluation Data

To update the saved HTML data used for evaluation, run:

```bash
deno task fetch-eval-data
```

This script:

1. Fetches HTML from the source website
2. Processes it with `prepareHtmlForAI` (the same function used in production)
3. Saves both raw and processed HTML to the `eval-data` directory

The evaluation script will:

1. Run the extraction pipeline on the test recipe
2. Compare the results with the expected output
3. Score various aspects of the extraction (ingredient normalization, etc.)
4. Provide an overall quality score

## Extending the Evaluation

To add more test cases:

1. Add new recipe content in the `extraction_eval.ts` file
2. Create an expected extraction result object
3. Update the evaluation function to test specific aspects of the new recipe

## Key Evaluation Criteria

The evaluation focuses on several key aspects:

1. **Ingredient Normalization**: Verifies that branded ingredients (e.g., "Del
   Maguey Vida Mezcal") are converted to generic names ("Mezcal") with brand
   information moved to notes

2. **Data Completeness**: Checks that all ingredients, instructions, and other
   recipe elements are properly extracted

3. **Structural Accuracy**: Ensures that data is organized correctly according
   to the application's data model

## Future Improvements

- Add more diverse test cases (different recipe formats, sources)
- Implement more detailed scoring for different aspects of extraction
- Create a visual report showing extraction performance over time
