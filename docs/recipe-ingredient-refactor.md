# Recipe Ingredient Data Structure Refactor Plan

## 1. Current Structure

### 1.1 In the Recipe Object

- Each `Recipe` contains an `ingredients` field:
  - `ingredients: RecipeIngredient[]`
- Each `RecipeIngredient` includes:
  - `ingredientId: string` (reference to the ingredient)
  - `name: string` (ingredient display name, stored directly in the recipe)
  - `quantity: number`
  - `unit: string`
  - `optional: boolean`
  - `notes: string`

### 1.2 Ingredient Relationships in the Database

- For each recipe, ingredient relationships are stored as:
  - Key: `["recipe_ingredient", recipeId, ingredientId]`
  - Value: `IngredientRecipeLink` (same fields as `RecipeIngredient` plus
    `recipeId`)
- Reverse index for lookup:
  - Key: `["ingredient_recipes", ingredientId, recipeId]`
  - Value: `true`

### 1.3 Full Ingredient Details

- For display, ingredient names are now stored directly in the recipe's
  `ingredients` array. No runtime lookup is required.

### 1.4 Ingredient Data

- Ingredient details are stored separately:
  - Key: `["ingredient", ingredientId]`
  - Value: `Ingredient` (fields: `name`, `description`, `type`, `image`, etc.)

---

## 2. Refactor Goals

- Improve recipe page performance by eliminating the need for
  `getWithFullIngredients`.
- Store the ingredient name (and possibly other display fields) directly in each
  recipe's `ingredients` array, so that ingredient lookups by `ingredientId` are
  no longer required for display.

## 3. Proposed Changes

### Data Model Changes

- Update `RecipeIngredient` to include the ingredient `name` (and optionally
  `description`, `type`, `image` if needed for display) directly in each
  ingredient entry within a recipe.
- Continue to use the `notes` field for any preferred brand or
  ingredient-specific recommendations.
- The `ingredientId` will still be stored for normalization and linking, but UI
  rendering will use the stored name.

### Recipe CRUD Logic

- Update all recipe creation and update logic to store the ingredient name (and
  any other display fields) at the time the recipe is created or updated.
- Remove the need for `getWithFullIngredients` by ensuring all display data is
  present in the recipe document.
- Update any helper functions (e.g., in `recipe-helper.ts`) to populate these
  fields when creating or updating recipes.

### Migration Plan

- Write a migration script to iterate over all existing recipes:
  - For each ingredient in each recipe, look up the ingredient by `ingredientId`
    and copy the `name` (and optionally other display fields) into the recipe's
    ingredient array.
  - Save the updated recipe back to the database.
- Remove or deprecate any code that relies on fetching ingredient details at
  runtime for display (e.g., `getWithFullIngredients`).

### UI & API Updates

- Update all UI components and API endpoints to use the new structure, reading
  ingredient names directly from the recipe data.
- Ensure forms for creating and editing recipes populate and save the ingredient
  name field.

### Testing

- Update and expand tests to verify that ingredient names are present in all
  recipes and that the UI does not require additional lookups for display.

---

_This document is a work in progress for planning the refactor of the recipe
ingredient data structure._
