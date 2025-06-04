import type { IngredientType, MeasurementUnit } from "../types/ingredient.ts";
import { executeDbOperation, kv } from "../utils/db.ts";
import { ingredientModel } from "../utils/ingredient-model.ts";
import {
  createRecipeWithSimpleIngredients,
  SimpleIngredient,
} from "../utils/recipe-helper.ts";

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
 * Initialize starter recipes using JIT ingredient creation
 */
async function initializeRecipes(): Promise<void> {
  const starterRecipes: Array<{
    name: string;
    description: string;
    strength: number;
    sweetness: number;
    preparation: string[];
    ingredients: SimpleIngredient[];
    tags?: string[];
    glassware?: string;
    garnish?: string[];
  }> = [
    {
      name: "Old Fashioned",
      description: "A classic cocktail that showcases the character of bourbon",
      preparation: [
        "Add simple syrup and bitters to a rocks glass",
        "Add bourbon and stir",
        "Add a large ice cube and stir until well chilled",
        "Express orange peel over drink and garnish",
      ],
      ingredients: [
        {
          name: "Bourbon Whiskey",
          quantity: "2",
          unit: "oz",
          optional: false,
          type: "spirit",
          abv: 40,
        },
        {
          name: "Simple Syrup",
          quantity: "0.25",
          unit: "oz",
          optional: false,
          type: "syrup",
        },
        {
          name: "Angostura Bitters",
          quantity: "2",
          unit: "dash",
          optional: false,
          type: "bitter",
        },
      ],
      tags: ["classic", "spirit-forward"],
      glassware: "rocks",
      garnish: ["orange peel"],
      strength: 8,
      sweetness: 6,
    },
    {
      name: "Negroni",
      description: "A perfectly balanced bitter Italian classic cocktail",
      preparation: [
        "Add all ingredients to a mixing glass with ice",
        "Stir until well-chilled (about 30 seconds)",
        "Strain into a rocks glass over a large ice cube",
        "Express an orange peel over the drink and garnish",
      ],
      ingredients: [
        {
          name: "London Dry Gin",
          quantity: "1",
          unit: "oz",
          optional: false,
          type: "spirit",
          abv: 42,
        },
        {
          name: "Campari",
          quantity: "1",
          unit: "oz",
          optional: false,
          type: "liqueur",
          abv: 24,
        },
        {
          name: "Sweet Vermouth",
          quantity: "1",
          unit: "oz",
          optional: false,
          type: "wine",
          abv: 16,
        },
      ],
      tags: ["classic", "bitter", "italian", "aperitif"],
      glassware: "rocks",
      garnish: ["orange peel"],
      strength: 9,
      sweetness: 4,
    },
    {
      name: "Whiskey Sour",
      description: "A perfectly balanced sweet and sour whiskey cocktail",
      preparation: [
        "Add all ingredients to a shaker with ice",
        "Shake vigorously for about 15 seconds",
        "Strain into a rocks glass over fresh ice",
        "Garnish with an orange slice and a cherry",
      ],
      ingredients: [
        {
          name: "Bourbon Whiskey",
          quantity: "2",
          unit: "oz",
          optional: false,
          type: "spirit",
          abv: 40,
        },
        {
          name: "Fresh Lemon Juice",
          quantity: "0.75",
          unit: "oz",
          optional: false,
          type: "juice",
        },
        {
          name: "Simple Syrup",
          quantity: "0.5",
          unit: "oz",
          optional: false,
          type: "syrup",
        },
        {
          name: "Egg White",
          quantity: "0.5",
          unit: "oz",
          optional: true,
          type: "other",
        },
      ],
      tags: ["classic", "sour", "shaken"],
      glassware: "rocks",
      garnish: ["orange slice", "cocktail cherry"],
      strength: 7,
      sweetness: 5,
    },
    {
      name: "Mojito",
      description: "A refreshing Cuban highball with mint and lime",
      preparation: [
        "In a highball glass, muddle mint leaves with simple syrup and lime juice",
        "Add rum and fill the glass with crushed ice",
        "Top with soda water and stir gently",
        "Garnish with a mint sprig and lime wheel",
      ],
      ingredients: [
        {
          name: "White Rum",
          quantity: "2",
          unit: "oz",
          optional: false,
          type: "spirit",
          abv: 40,
        },
        {
          name: "Fresh Lime Juice",
          quantity: "0.75",
          unit: "oz",
          optional: false,
          type: "juice",
        },
        {
          name: "Simple Syrup",
          quantity: "0.5",
          unit: "oz",
          optional: false,
          type: "syrup",
        },
        {
          name: "Fresh Mint Leaves",
          quantity: "8",
          unit: "leaf",
          optional: false,
          type: "herb",
        },
        {
          name: "Soda Water",
          quantity: "2",
          unit: "oz",
          optional: false,
          type: "mixer",
        },
      ],
      tags: ["classic", "refreshing", "summer", "cuban"],
      glassware: "highball",
      garnish: ["mint sprig", "lime wheel"],
      strength: 6,
      sweetness: 6,
    },
    {
      name: "Cosmopolitan",
      description: "A sophisticated cranberry and citrus vodka cocktail",
      preparation: [
        "Add all ingredients to a shaker with ice",
        "Shake until well-chilled",
        "Double strain into a chilled cocktail glass",
        "Garnish with a lime wheel or orange twist",
      ],
      ingredients: [
        {
          name: "Citrus Vodka",
          quantity: "1.5",
          unit: "oz",
          optional: false,
          type: "spirit",
          abv: 40,
        },
        {
          name: "Cointreau",
          quantity: "0.75",
          unit: "oz",
          optional: false,
          type: "liqueur",
          abv: 40,
        },
        {
          name: "Cranberry Juice",
          quantity: "0.75",
          unit: "oz",
          optional: false,
          type: "juice",
        },
        {
          name: "Fresh Lime Juice",
          quantity: "0.5",
          unit: "oz",
          optional: false,
          type: "juice",
        },
      ],
      tags: ["classic", "fruity", "shaken", "90s"],
      glassware: "cocktail",
      garnish: ["lime wheel", "orange twist"],
      strength: 7,
      sweetness: 6,
    },
    // Add more starter recipes here
  ];

  console.log("Initializing starter recipes with JIT ingredient creation...");

  for (const recipe of starterRecipes) {
    // Create the recipe with JIT ingredient creation
    await createRecipeWithSimpleIngredients({
      name: recipe.name,
      description: recipe.description,
      preparation: recipe.preparation,
      ingredients: recipe.ingredients,
      tags: recipe.tags || [],
      glassware: recipe.glassware || "",
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
 * Reset the database by deleting all data
 */
async function resetDatabase(): Promise<void> {
  console.log("Resetting database...");

  // Delete ingredients
  for await (const entry of kv.list({ prefix: ["ingredient"] })) {
    await kv.delete(entry.key);
  }

  // Delete recipes
  for await (const entry of kv.list({ prefix: ["recipe"] })) {
    await kv.delete(entry.key);
  }

  // Delete recipe-ingredient relations
  for await (const entry of kv.list({ prefix: ["recipe_ingredient"] })) {
    await kv.delete(entry.key);
  }

  // Delete ingredient-recipes relations
  for await (const entry of kv.list({ prefix: ["ingredient_recipes"] })) {
    await kv.delete(entry.key);
  }

  // Delete tag-recipes relations
  for await (const entry of kv.list({ prefix: ["tag_recipes"] })) {
    await kv.delete(entry.key);
  }

  // Delete strength-recipes relations
  for await (const entry of kv.list({ prefix: ["strength_recipes"] })) {
    await kv.delete(entry.key);
  }

  // Delete sweetness-recipes relations
  for await (const entry of kv.list({ prefix: ["sweetness_recipes"] })) {
    await kv.delete(entry.key);
  }

  // Delete DB version
  await kv.delete(DB_VERSION_KEY);

  console.log("Database reset complete!");
}

/**
 * Main initialization function
 */
async function initializeDatabase(): Promise<void> {
  const dbInit = executeDbOperation(async () => {
    // Check if already initialized
    if (await isInitialized()) {
      console.log("Database is already initialized.");

      // Ask whether to reset
      if (
        await confirm("Do you want to reset the database and initialize again?")
      ) {
        await resetDatabase();
      } else {
        return;
      }
    }

    console.log("Starting database initialization...");

    try {
      // Initialize in order - still create base ingredients for browsing
      await initializeIngredients();

      // Initialize recipes with JIT approach
      await initializeRecipes();

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
