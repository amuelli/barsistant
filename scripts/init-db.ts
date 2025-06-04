import type { IngredientType, MeasurementUnit } from "../types/ingredient.ts";
import type { RecipeIngredient } from "../types/recipe.ts";
import { executeDbOperation, kv } from "../utils/db.ts";
import { ingredientModel } from "../utils/ingredient-model.ts";
import { recipeModel } from "../utils/recipe-model.ts";

const DB_VERSION_KEY = ["db_meta", "version"];
const CURRENT_VERSION = 1;

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
 * Initialize base ingredients
 */
async function initializeIngredients(): Promise<Map<string, string>> {
  // Map of ingredient name to ID for recipe relationships
  const ingredientIds = new Map<string, string>();

  const baseIngredients: Array<{
    name: string;
    description: string;
    type: IngredientType;
    commonMeasurements: MeasurementUnit[];
    abv?: number;
    allergens?: string[];
  }> = [
    {
      name: "Bourbon Whiskey",
      description: "American whiskey made primarily from corn",
      type: "spirit",
      commonMeasurements: ["oz", "ml"],
      abv: 40,
    },
    {
      name: "Angostura Bitters",
      description: "Classic aromatic bitters used in many cocktails",
      type: "bitter",
      commonMeasurements: ["dash", "drop"],
      allergens: ["gentian"],
    },
    {
      name: "Simple Syrup",
      description: "Equal parts sugar and water, dissolved",
      type: "syrup",
      commonMeasurements: ["oz", "ml"],
    },
    // Add more base ingredients here
  ];

  console.log("Initializing base ingredients...");

  for (const ingredient of baseIngredients) {
    const created = await ingredientModel.create(ingredient);
    ingredientIds.set(ingredient.name, created.id);
    console.log(`Created ingredient: ${ingredient.name}`);
  }

  return ingredientIds;
}

/**
 * Initialize starter recipes using the created ingredients
 */
async function initializeRecipes(
  ingredientIds: Map<string, string>,
): Promise<void> {
  const starterRecipes: Array<{
    name: string;
    description: string;
    instructions: string[];
    ingredients: Array<{
      name: string;
      quantity: string;
      unit: MeasurementUnit;
      optional?: boolean;
    }>;
    tags?: string[];
    glass?: string;
    garnish?: string[];
    strength?: number;
    sweetness?: number;
  }> = [
    {
      name: "Old Fashioned",
      description: "A classic cocktail that showcases the character of bourbon",
      instructions: [
        "Add simple syrup and bitters to a rocks glass",
        "Add bourbon and stir",
        "Add a large ice cube and stir until well chilled",
        "Express orange peel over drink and garnish",
      ],
      ingredients: [
        { name: "Bourbon Whiskey", quantity: "2", unit: "oz", optional: false },
        { name: "Simple Syrup", quantity: "0.25", unit: "oz", optional: false },
        {
          name: "Angostura Bitters",
          quantity: "2",
          unit: "dash",
          optional: false,
        },
      ],
      tags: ["classic", "spirit-forward"],
      glass: "rocks",
      garnish: ["orange peel"],
      strength: 8,
      sweetness: 6,
    },
    // Add more starter recipes here
  ];

  console.log("Initializing starter recipes...");

  for (const recipe of starterRecipes) {
    // Convert ingredient references to IDs
    const recipeIngredients: RecipeIngredient[] = recipe.ingredients.map(
      (ing) => ({
        ingredientId: ingredientIds.get(ing.name)!,
        quantity: ing.quantity,
        unit: ing.unit,
        optional: ing.optional ?? false,
      }),
    );

    // Create the recipe
    await recipeModel.create({
      name: recipe.name,
      description: recipe.description,
      preparation: recipe.instructions,
      ingredients: recipeIngredients,
      tags: recipe.tags || [],
      glassware: recipe.glass || "",
      garnish: recipe.garnish || [],
      strength: recipe.strength || 5,
      sweetness: recipe.sweetness || 5,
      source: {
        name: "Barsistant Default",
      },
    });

    console.log(`Created recipe: ${recipe.name}`);
  }
}

/**
 * Main initialization function
 */
async function initializeDatabase(): Promise<void> {
  const dbInit = executeDbOperation(async () => {
    // Check if already initialized
    if (await isInitialized()) {
      console.log("Database is already initialized.");
      return;
    }

    console.log("Starting database initialization...");

    try {
      // Initialize in order
      const ingredientIds = await initializeIngredients();
      await initializeRecipes(ingredientIds);

      // Mark as initialized only after everything succeeds
      await markInitialized();

      console.log("Database initialization complete!");
    } catch (error) {
      console.error("Error during initialization:", error);
      throw error;
    }
  }, "Database initialization failed");

  return await dbInit;
}

// Run the initialization
if (import.meta.main) {
  await initializeDatabase();
  Deno.exit(0);
}
