# Name-Based Ingredient API for Barsistant

This document provides an overview of the name-based ingredient management
system for the Barsistant application. The system allows users to work with
ingredients using human-readable names instead of opaque IDs, while still
maintaining proper data normalization under the hood.

## Design Philosophy

Our approach balances two competing concerns:

1. **User Experience**: Users think of ingredients by name, not by ID. Recipe
   creation should be as simple as saying "2 oz of Bourbon" rather than
   referencing ingredient IDs.

2. **Data Integrity**: We still need proper normalization for consistency,
   preventing duplication, and maintaining relationships.

The solution is a hybrid approach that:

- Maintains the ID-based data model for internal storage
- Provides a higher-level API that works with ingredient names
- Performs just-in-time (JIT) ingredient creation when new ingredients are
  referenced

## Implementation Overview

The name-based ingredient system is fully implemented at the module level,
providing a foundation for simplified recipe management. All core functionality
is available through the `recipe-helper.ts` module, which serves as a
higher-level API layer above the standard database models.

### Recipe Helper Functions

The system provides these key functions for name-based ingredient handling:

1. **Create Recipe with Simple Ingredients**\
   Creates a recipe with ingredients specified by name rather than ID,
   automatically creating new ingredients as needed.

   ```typescript
   const recipe = await createRecipeWithSimpleIngredients({
     name: "Old Fashioned",
     description: "A classic whiskey cocktail",
     strength: 8,
     sweetness: 6,
     ingredients: [
       {
         name: "Bourbon Whiskey",
         quantity: 2,
         unit: "oz",
         type: "spirit",
         abv: 40,
       },
       {
         name: "Simple Syrup",
         quantity: 0.25,
         unit: "oz",
         type: "syrup",
       },
       {
         name: "Angostura Bitters",
         quantity: 2,
         unit: "dash",
         type: "bitter",
       },
     ],
     preparation: [
       "Stir ingredients with ice",
       "Strain into rocks glass",
       "Garnish with orange peel",
     ],
     garnish: ["orange peel"],
     glassware: "rocks glass",
     tags: ["classic", "whiskey"],
   });
   ```

2. **Update Recipe with Simple Ingredients**\
   Updates a recipe using ingredient names instead of IDs:

   ```typescript
   const updatedRecipe = await updateRecipeWithSimpleIngredients("recipe-id", {
     ingredients: [
       {
         name: "Rye Whiskey",
         quantity: 2,
         unit: "oz",
         type: "spirit",
       },
       {
         name: "Simple Syrup",
         quantity: 0.25,
         unit: "oz",
         type: "syrup",
       },
       {
         name: "Angostura Bitters",
         quantity: 2,
         unit: "dash",
         type: "bitter",
       },
     ],
   });
   ```

3. **Find or Create Ingredients**\
   Finds an ingredient by name or creates it if not found:

   ```typescript
   const ingredient = await findOrCreateIngredient({
     name: "Yellow Chartreuse",
     type: "liqueur",
     description: "Herbal liqueur made by Carthusian monks",
     abv: 40,
     commonMeasurements: ["oz", "ml"],
   });
   ```

## Implementation Details

The system is implemented through:

1. **recipe-helper.ts**: A fully implemented and tested utility module that
   provides name-based operations
   - `createRecipeWithSimpleIngredients`: Creates recipes with JIT ingredient
     creation
   - `updateRecipeWithSimpleIngredients`: Updates recipes with name-based
     ingredients
   - `findIngredientByName`: Searches for ingredients by name (case-insensitive)
   - `findOrCreateIngredient`: Finds or creates ingredients by name
   - `getRecipeWithIngredientNames`: Gets a recipe with full ingredient details
   - `getRecipesByIngredientName`: Finds recipes that use a specific ingredient
     by name
   - `createIngredientNameMap`: Creates a mapping from ingredient names to IDs

2. **Current Usage**:
   - Used in `scripts/init-db.ts` to initialize the database with sample recipes
   - Comprehensive test suite in `recipe-helper_test.ts` verifies all
     functionality

3. **Planned API Endpoints** (not yet implemented):
   - `/api/recipes`: Will create and list recipes with simple ingredients
   - `/api/recipes/{id}`: Will get, update and delete recipes with name-based
     ingredients
   - `/api/ingredients/find-or-create`: Will find or create ingredients by name
   - `/api/ingredients/find-by-name`: Will search for ingredients by name

## Benefits

The implemented system offers several advantages:

1. **Simplified Recipe Creation**: The codebase can create and update recipes
   without first adding ingredients separately
2. **Consistent Data**: The system maintains proper relationships under the hood
   with proper ID management
3. **Flexibility**: The ID-based model is still available for advanced
   operations
4. **Automatic Deduplication**: Prevents duplicate ingredients with the same
   name through case-insensitive lookup
5. **Comprehensive Testing**: All helper functions are verified with unit tests

## Current Limitations and Future Enhancements

Current limitations and planned future enhancements:

1. **API Integration**: Expose these helper functions through REST API endpoints
2. **Web UI Integration**: Update the web interface to use the name-based
   ingredient API
3. **Fuzzy Matching**: Enhanced name matching for ingredients with slight
   spelling variations
4. **Ingredient Merging**: Tools to merge duplicate ingredients that may have
   been created
5. **Suggestions**: Auto-complete and suggestions for ingredient names during
   recipe creation
6. **Bulk Operations**: Tools for bulk recipe creation with name-based
   ingredients

## Conclusion

The name-based ingredient system is fully implemented at the module level in
`recipe-helper.ts`, providing a solid foundation for simplified recipe
management. All core functionality has been developed and thoroughly tested,
making it ready for integration into the web interface.

While the API endpoints have not yet been implemented, the underlying
functionality is complete and working as intended. The system successfully
balances user experience with data integrity, offering a robust solution for
managing ingredients by name while maintaining proper data normalization under
the hood.

Current usage includes database initialization scripts, with planned expansion
to web API endpoints in future development phases.
