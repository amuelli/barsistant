// Load environment variables from .env if present, before any other imports
import "@std/dotenv/load";
import {
  ingredients as sampleIngredients,
  recipes as sampleRecipes,
} from "../scripts/data.ts";
import { kv } from "🛠️/db/db.ts";
import { ingredientModel } from "🛠️/db/ingredient-model.ts";
import { createRecipeWithSimpleIngredients } from "🛠️/db/recipe-helper.ts";

const DB_VERSION_KEY = ["db_meta", "version"];
const CURRENT_VERSION = 1;

/**
 * Prompt the user for confirmation
 * @param message The message to display
 * @returns True if confirmed, false otherwise
 */
async function confirm(message: string): Promise<boolean> {
  console.log(`${message} (y/N)`);

  // Create a buffer reader for stdin
  const buffer = new Uint8Array(1024);
  const n = await Deno.stdin.read(buffer);

  if (n === null) {
    return false; // EOF reached
  }

  const input = new TextDecoder().decode(buffer.subarray(0, n)).trim()
    .toLowerCase();
  return input === "y" || input === "yes";
}

/**
 * Check if the database has already been initialized
 */
async function isInitialized(): Promise<boolean> {
  const result = await kv.get<number>(DB_VERSION_KEY);
  return result.value === CURRENT_VERSION;
}

/**
 * Mark the database as initialized
 */
async function markInitialized(): Promise<void> {
  await kv.set(DB_VERSION_KEY, CURRENT_VERSION);
}

/**
 * Initialize base ingredients - this is still useful to have standard ingredients
 * available for browsing, even with the JIT approach
 */
async function initializeIngredients(): Promise<void> {
  console.log("Initializing basic ingredients...");

  // Use sampleIngredients from data.ts
  const ingredients = sampleIngredients;

  // Create each ingredient
  for (const ingredient of ingredients) {
    await ingredientModel.create(ingredient);
    console.log(`Created ingredient: ${ingredient.name} (${ingredient.type})`);
  }
}

/**
 * Initialize recipes using the sample recipes from data.ts
 */
async function initializeRecipes(): Promise<void> {
  console.log("Initializing recipes from sample data...");

  // Create recipes from the sample data in data.ts
  // These will get new IDs and timestamps since we've removed those fields
  for (const recipe of sampleRecipes) {
    try {
      // Convert RecipeIngredient to SimpleIngredient by adding the missing 'type' field
      const simpleIngredients = recipe.ingredients.map((ingredient) => ({
        ...ingredient,
        // Hardcoded ingredient type based on sample data definitions
        type: ingredient.type,
      }));

      // Create the recipe with the enhanced ingredients
      // Note: Sample recipes are created with a system user ID
      const newRecipe = await createRecipeWithSimpleIngredients({
        ...recipe,
        ingredients: simpleIngredients,
        createdBy: "system", // System-created recipes
        visibility: "public", // Make sample recipes public
      });

      console.log(`Created recipe: ${recipe.name} with ID ${newRecipe.id}`);
    } catch (error) {
      console.error(`Failed to create recipe ${recipe.name}:`, error);
    }
  }
}

/**
 * Reset the database by deleting all data
 */
async function resetDatabase(): Promise<void> {
  const allEntries = await Array.fromAsync(kv.list({ prefix: [] }));
  for (const entry of allEntries) {
    await kv.delete(entry.key);
  }
}

// Main function
async function main(): Promise<void> {
  console.log("Barsistant Database Initialization Tool");
  console.log("======================================");

  // Check if database is already initialized
  const initialized = await isInitialized();
  if (initialized) {
    console.log("Database is already initialized to version", CURRENT_VERSION);

    // Ask for reset
    if (!await confirm("Do you want to reset the database?")) {
      console.log("Exiting without changes.");
      return;
    }

    // Reset database
    await resetDatabase();
  }

  // Initialize database
  console.log("Initializing database to version", CURRENT_VERSION);

  // Import ingredients and recipes
  await initializeIngredients();
  await initializeRecipes();

  await markInitialized();
  console.log("Database initialization complete.");
}

// Run the main function
await main();
