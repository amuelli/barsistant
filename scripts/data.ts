/**
 * Sample recipe data for testing and development
 *
 * This file provides sample recipe data that can be used for testing,
 * development, and database seeding.
 */

import { Ingredient } from "../types/ingredient.ts";
import type { Recipe } from "../types/recipe.ts";
import {
  CreateRecipeWithSimpleIngredientsParams,
} from "../utils/db/recipe-helper.ts";

/**
 * Type for recipe creation that omits fields automatically generated during creation
 * such as ID and timestamps.
 */
export type RecipeCreationData = Omit<Recipe, "id" | "createdAt" | "updatedAt">;

/**
 * Sample recipes ready for insertion into the database
 * These don't include IDs or timestamps, which will be generated during creation
 */
export const recipes: CreateRecipeWithSimpleIngredientsParams[] = [
  {
    name: "Old Fashioned Cocktail (Difford's Recipe)",
    description:
      "Discover how to make an Old Fashioned Cocktail (Difford's recipe) using Bourbon whiskey, " +
      "Rye whiskey 50% abv, brown sugar syrup, Abbott's bitters, and saline solution. " +
      "This classic cocktail is spirit-forward and perfect for sipping.",
    strength: 5,
    sweetness: 5,
    ingredients: [
      {
        name: "Bourbon Whiskey",
        type: "spirit",
        quantity: 45,
        unit: "ml",
        optional: false,
      },
      {
        name: "Rye whiskey 50% abv",
        type: "spirit",
        quantity: 30,
        unit: "ml",
        optional: false,
      },
      {
        name: "Brown sugar syrup",
        type: "syrup",
        quantity: 10,
        unit: "ml",
        optional: false,
      },
      {
        name: "Abbott's bitters",
        type: "bitter",
        quantity: 8,
        unit: "drop",
        optional: false,
      },
      {
        name: "Saline solution 4:1",
        type: "other",
        quantity: 3,
        unit: "drop",
        optional: false,
      },
    ],
    garnish: ["Orange zest twist"],
    glassware: "old-fashioned",
    preparation: [
      "Select and pre-chill an Old-fashioned glass.",
      "Prepare garnish of orange zest twist.",
      "STIR all ingredients with ice.",
      "STRAIN into ice-filled glass (preferably over a large cube or chunk of block ice).",
      "EXPRESS orange zest twist over the cocktail and use as garnish.",
    ],
    source: {
      name: "Difford's Guide",
      url:
        "https://www.diffordsguide.com/cocktails/recipe/1427/old-fashioned-cocktail-diffords-recipe",
      image:
        "https://cdn.diffordsguide.com/cocktail/3O7l4R/default/0/512x.webp",
    },
    tags: [
      "classic-vintage",
      "hall-of-fame-and-must-know-try",
      "nightcap-sipping",
      "spirit-forward",
      "old-fashioned",
    ],
  },
  {
    name: "Cosmic Alaska",
    description:
      "The Cosmic Alaska is a spirit-forward cocktail with a herbal profile, combining gin, vermouth, vodka, and green liqueurs. It's a short and stirred drink, perfect for those who appreciate a complex and aromatic experience.",
    strength: 5,
    sweetness: 5,
    ingredients: [
      {
        name: "Gin",
        type: "spirit",
        quantity: 30,
        unit: "ml",
        optional: false,
      },
      {
        name: "Bianco/blanc/blanco vermouth",
        type: "wine",
        quantity: 22.5,
        unit: "ml",
        optional: false,
      },
      {
        name: "Vodka",
        type: "spirit",
        quantity: 15,
        unit: "ml",
        optional: false,
      },
      {
        name: "Chartreuse Green",
        type: "liqueur",
        quantity: 7.5,
        unit: "ml",
        optional: false,
      },
      {
        name: "Green melon liqueur",
        type: "liqueur",
        quantity: 7.5,
        unit: "ml",
        optional: false,
      },
    ],
    garnish: [
      "skewered Luxardo Maraschino Cherries",
    ],
    glassware: "nick-and-nora",
    preparation: [
      "Select and pre-chill a Nick and Nora glass.",
      "Prepare garnish of skewered Luxardo Maraschino Cherries.",
      "STIR all ingredients with ice.",
      "FINE STRAIN into chilled glass.",
      "Garnish with skewered cherries.",
    ],
    source: {
      name: "Difford's Guide",
      url: "https://www.diffordsguide.com/cocktails/recipe/29165/cosmic-alaska",
      image:
        "https://cdn.diffordsguide.com/cocktail/AGYlMO/square/0/512x512.webp",
    },
    tags: [
      "herbal",
      "short-and-stirred",
      "spirit-forward",
    ],
  },
];

/**
 * Type for ingredient creation that omits fields automatically generated during creation
 * and adds optional origin field
 */
export type IngredientCreationData =
  & Omit<Ingredient, "id" | "createdAt" | "updatedAt">
  & {
    origin?: string; // Additional field for display purposes
  };

/**
 * Sample ingredients ready for database seeding
 */
export const ingredients: IngredientCreationData[] = [
  // Spirits
  {
    name: "Bourbon Whiskey",
    type: "spirit",
    abv: 40,
    description: "American whiskey made primarily from corn.",
  },
  {
    name: "Rye Whiskey",
    type: "spirit",
    abv: 45,
    description: "Whiskey made from rye grain, known for its spicy flavor.",
    origin: "USA/Canada",
  },
  {
    name: "Scotch Whisky",
    type: "spirit",
    abv: 40,
    description: "Whisky made in Scotland, typically from malted barley.",
    origin: "Scotland",
  },
  {
    name: "Irish Whiskey",
    type: "spirit",
    abv: 40,
    description: "Smooth whiskey triple-distilled in Ireland.",
    origin: "Ireland",
  },
  {
    name: "Vodka",
    type: "spirit",
    abv: 40,
    description: "Neutral spirit distilled from grains or potatoes.",
    origin: "Eastern Europe",
  },
  {
    name: "Gin",
    type: "spirit",
    abv: 40,
    description: "Spirit flavored with juniper berries and botanicals.",
    origin: "England",
  },
  {
    name: "White Rum",
    type: "spirit",
    abv: 40,
    description: "Light rum distilled from sugarcane.",
    origin: "Caribbean",
  },
  {
    name: "Dark Rum",
    type: "spirit",
    abv: 40,
    description: "Aged rum with a rich, caramel flavor.",
    origin: "Caribbean",
  },
  {
    name: "Aged Rum",
    type: "spirit",
    abv: 40,
    description: "Rum aged in barrels for deeper flavor.",
    origin: "Caribbean",
  },
  {
    name: "Blanco Tequila",
    type: "spirit",
    abv: 40,
    description: "Unaged tequila made from blue agave.",
    origin: "Mexico",
  },
  {
    name: "Reposado Tequila",
    type: "spirit",
    abv: 40,
    description: "Tequila aged in oak barrels for 2-12 months.",
    origin: "Mexico",
  },
  {
    name: "Añejo Tequila",
    type: "spirit",
    abv: 40,
    description: "Tequila aged in oak barrels for 1-3 years.",
    origin: "Mexico",
  },
  {
    name: "Mezcal",
    type: "spirit",
    abv: 40,
    description: "Smoky spirit made from agave, often roasted in pits.",
    origin: "Mexico",
  },
  {
    name: "Brandy",
    type: "spirit",
    abv: 40,
    description: "Spirit distilled from wine or fermented fruit juice.",
    origin: "France/Spain",
  },
  {
    name: "Cognac",
    type: "spirit",
    abv: 40,
    description: "Premium French brandy from the Cognac region.",
    origin: "France",
  },

  // Liqueurs
  {
    name: "Triple Sec",
    type: "liqueur",
    abv: 30,
    description: "Orange-flavored liqueur used in many cocktails.",
    origin: "France",
  },
  {
    name: "Cointreau",
    type: "liqueur",
    abv: 40,
    description: "Premium orange liqueur, clear and crisp.",
    origin: "France",
  },
  {
    name: "Grand Marnier",
    type: "liqueur",
    abv: 40,
    description: "Orange liqueur blended with cognac.",
    origin: "France",
  },
  {
    name: "Green Chartreuse",
    type: "liqueur",
    abv: 55,
    description: "Herbal liqueur made by Carthusian monks.",
    origin: "France",
  },
  {
    name: "Yellow Chartreuse",
    type: "liqueur",
    abv: 40,
    description: "Milder, sweeter herbal liqueur.",
    origin: "France",
  },
  {
    name: "Campari",
    type: "liqueur",
    abv: 25,
    description: "Bitter, bright red Italian aperitif.",
    origin: "Italy",
  },
  {
    name: "Aperol",
    type: "liqueur",
    abv: 11,
    description: "Light, bittersweet orange aperitif.",
    origin: "Italy",
  },
  {
    name: "Amaretto",
    type: "liqueur",
    abv: 28,
    description: "Sweet, almond-flavored Italian liqueur.",
    origin: "Italy",
  },
  {
    name: "Coffee Liqueur",
    type: "liqueur",
    abv: 20,
    description: "Sweet liqueur flavored with coffee.",
    origin: "Various",
  },
  {
    name: "Maraschino Liqueur",
    type: "liqueur",
    abv: 32,
    description: "Clear cherry liqueur from Marasca cherries.",
    origin: "Italy/Croatia",
  },
  {
    name: "Orange Curaçao",
    type: "liqueur",
    abv: 40,
    description: "Orange-flavored liqueur from Curaçao island.",
    origin: "Netherlands Antilles",
  },
  {
    name: "Crème de Cassis",
    type: "liqueur",
    abv: 20,
    description: "Sweet, dark red liqueur made from blackcurrants.",
    origin: "France",
  },
  {
    name: "Crème de Menthe",
    type: "liqueur",
    abv: 25,
    description: "Mint-flavored sweet liqueur.",
    origin: "France",
  },
  {
    name: "Crème de Violette",
    type: "liqueur",
    abv: 20,
    description: "Floral liqueur made from violet flowers.",
    origin: "France",
  },
  {
    name: "Limoncello",
    type: "liqueur",
    abv: 30,
    description: "Sweet lemon liqueur from southern Italy.",
    origin: "Italy",
  },

  // Vermouth and Fortified Wines
  {
    name: "Dry Vermouth",
    type: "fortified_wine",
    abv: 18,
    description: "Dry, aromatic fortified wine.",
    origin: "France/Italy",
  },
  {
    name: "Sweet Vermouth",
    type: "fortified_wine",
    abv: 16,
    description: "Sweet, red fortified wine.",
    origin: "Italy",
  },
  {
    name: "Bianco Vermouth",
    type: "fortified_wine",
    abv: 16,
    description: "White, semi-sweet vermouth.",
    origin: "Italy",
  },
  {
    name: "Port Wine",
    type: "fortified_wine",
    abv: 20,
    description: "Sweet, fortified wine from Portugal.",
    origin: "Portugal",
  },
  {
    name: "Sherry",
    type: "fortified_wine",
    abv: 17,
    description: "Fortified wine from Jerez, Spain.",
    origin: "Spain",
  },

  // Mixers
  {
    name: "Club Soda",
    type: "mixer",
    abv: 0,
    description: "Carbonated water with added minerals.",
    origin: "Various",
  },
  {
    name: "Tonic Water",
    type: "mixer",
    abv: 0,
    description: "Carbonated water with quinine and sweetener.",
    origin: "Various",
  },
  {
    name: "Ginger Ale",
    type: "mixer",
    abv: 0,
    description: "Sweet, carbonated ginger-flavored soft drink.",
    origin: "Various",
  },
  {
    name: "Ginger Beer",
    type: "mixer",
    abv: 0,
    description: "Spicy, fermented ginger-flavored drink.",
    origin: "UK",
  },
  {
    name: "Cola",
    type: "mixer",
    abv: 0,
    description: "Sweet, caramel-flavored carbonated drink.",
    origin: "USA",
  },
  {
    name: "Soda Water",
    type: "mixer",
    abv: 0,
    description: "Plain carbonated water.",
    origin: "Various",
  },

  // Juices
  {
    name: "Lemon Juice",
    type: "juice",
    abv: 0,
    description: "Juice from fresh lemons.",
    origin: "Various",
  },
  {
    name: "Lime Juice",
    type: "juice",
    abv: 0,
    description: "Juice from fresh limes.",
    origin: "Various",
  },
  {
    name: "Orange Juice",
    type: "juice",
    abv: 0,
    description: "Juice from fresh oranges.",
    origin: "Various",
  },
  {
    name: "Grapefruit Juice",
    type: "juice",
    abv: 0,
    description: "Juice from fresh grapefruits.",
    origin: "Various",
  },
  {
    name: "Pineapple Juice",
    type: "juice",
    abv: 0,
    description: "Juice from fresh pineapples.",
    origin: "Various",
  },
  {
    name: "Cranberry Juice",
    type: "juice",
    abv: 0,
    description: "Juice from cranberries.",
    origin: "USA/Canada",
  },
  {
    name: "Tomato Juice",
    type: "juice",
    abv: 0,
    description: "Juice from ripe tomatoes.",
    origin: "Various",
  },

  // Syrups
  {
    name: "Simple Syrup",
    type: "syrup",
    abv: 0,
    description: "Sugar dissolved in water.",
    origin: "Various",
  },
  {
    name: "Demerara Syrup",
    type: "syrup",
    abv: 0,
    description: "Syrup made from demerara sugar.",
    origin: "Various",
  },
  {
    name: "Honey Syrup",
    type: "syrup",
    abv: 0,
    description: "Honey diluted with water.",
    origin: "Various",
  },
  {
    name: "Maple Syrup",
    type: "syrup",
    abv: 0,
    description: "Syrup from maple tree sap.",
    origin: "Canada/USA",
  },
  {
    name: "Orgeat",
    type: "syrup",
    abv: 0,
    description: "Almond syrup with orange flower water.",
    origin: "France",
  },
  {
    name: "Grenadine",
    type: "syrup",
    abv: 0,
    description: "Sweet syrup from pomegranate juice.",
    origin: "France",
  },
  {
    name: "Gomme Syrup",
    type: "syrup",
    abv: 0,
    description: "Sugar syrup with gum arabic for smoothness.",
    origin: "France",
  },

  // Bitters
  {
    name: "Angostura Bitters",
    type: "bitter",
    abv: 44,
    description: "Aromatic bitters from Trinidad and Tobago.",
    origin: "Trinidad and Tobago",
  },
  {
    name: "Orange Bitters",
    type: "bitter",
    abv: 28,
    description: "Bitters flavored with orange peel.",
    origin: "Various",
  },
  {
    name: "Peychaud's Bitters",
    type: "bitter",
    abv: 35,
    description: "Aromatic bitters with anise and cherry notes.",
    origin: "USA",
  },
  {
    name: "Chocolate Bitters",
    type: "bitter",
    abv: 30,
    description: "Bitters flavored with cacao.",
    origin: "Various",
  },

  // Herbs and Spices
  {
    name: "Fresh Mint",
    type: "herb",
    abv: 0,
    description: "Aromatic herb used for garnish and flavor.",
    origin: "Various",
  },
  {
    name: "Fresh Basil",
    type: "herb",
    abv: 0,
    description: "Sweet, aromatic herb.",
    origin: "Various",
  },
  {
    name: "Fresh Rosemary",
    type: "herb",
    abv: 0,
    description: "Pine-scented herb.",
    origin: "Various",
  },
  {
    name: "Cinnamon",
    type: "spice",
    abv: 0,
    description: "Warm, sweet spice from cinnamon bark.",
    origin: "Sri Lanka/India",
  },
  {
    name: "Nutmeg",
    type: "spice",
    abv: 0,
    description: "Aromatic spice grated from nutmeg seed.",
    origin: "Indonesia",
  },
  {
    name: "Cloves",
    type: "spice",
    abv: 0,
    description: "Strong, aromatic spice.",
    origin: "Indonesia",
  },

  // Fruits
  {
    name: "Lemon",
    type: "fruit",
    abv: 0,
    description: "Citrus fruit used for juice and garnish.",
    origin: "Various",
  },
  {
    name: "Lime",
    type: "fruit",
    abv: 0,
    description: "Small green citrus fruit.",
    origin: "Various",
  },
  {
    name: "Orange",
    type: "fruit",
    abv: 0,
    description: "Sweet citrus fruit.",
    origin: "Various",
  },
  {
    name: "Grapefruit",
    type: "fruit",
    abv: 0,
    description: "Large, tart citrus fruit.",
    origin: "Various",
  },

  // Miscellaneous
  {
    name: "Egg White",
    type: "other",
    abv: 0,
    description: "Egg white for texture and foam.",
    origin: "Various",
  },
  {
    name: "Whole Egg",
    type: "other",
    abv: 0,
    description: "Whole egg for richness.",
    origin: "Various",
  },
  {
    name: "Cream",
    type: "other",
    abv: 0,
    description: "Dairy cream for richness.",
    origin: "Various",
  },
  {
    name: "Coconut Cream",
    type: "other",
    abv: 0,
    description: "Thick cream from coconut milk.",
    origin: "Tropics",
  },
  {
    name: "Sugar",
    type: "other",
    abv: 0,
    description: "Sweetener from sugarcane or beet.",
    origin: "Various",
  },
  {
    name: "Ice",
    type: "other",
    abv: 0,
    description: "Frozen water for chilling drinks.",
    origin: "Various",
  },
];
