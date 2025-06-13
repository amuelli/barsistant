// Migration script: Add ingredient names to all recipes in the database
// Run this script once after deploying the new RecipeIngredient structure

import type { Recipe } from "../types/recipe.ts";
import { kv } from "../utils/db.ts";
import { ingredientModel } from "../utils/ingredient-model.ts";
import { recipeModel } from "../utils/recipe-model.ts";

async function migrateAllRecipes() {
  let updatedCount = 0;
  for await (const entry of kv.list<Recipe>({ prefix: ["recipe"] })) {
    const recipe = entry.value;
    let changed = false;
    const newIngredients = [];
    for (const ing of recipe.ingredients) {
      // If name already present, skip
      if (ing.name && typeof ing.name === "string" && ing.name.length > 0) {
        newIngredients.push(ing);
        continue;
      }
      // Lookup ingredient by ID
      const ingredient = await ingredientModel.getById(ing.ingredientId);
      if (ingredient) {
        newIngredients.push({ ...ing, name: ingredient.name });
        changed = true;
      } else {
        // Fallback: use ID as name if not found
        newIngredients.push({ ...ing, name: ing.ingredientId });
        changed = true;
      }
    }
    if (changed) {
      await recipeModel.update(recipe.id, { ingredients: newIngredients });
      updatedCount++;
      console.log(`Updated recipe ${recipe.id} (${recipe.name})`);
    }
  }
  console.log(`Migration complete. Updated ${updatedCount} recipes.`);
}

if (import.meta.main) {
  migrateAllRecipes();
}
