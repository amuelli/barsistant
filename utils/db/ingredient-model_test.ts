/// <reference lib="deno.unstable" />

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import type { Ingredient, IngredientType } from "../../types/ingredient.ts";
import { ingredientModel } from "./ingredient-model.ts";

Deno.test("Ingredient Model - CRUD Operations", async (t) => {
  // Test data for first ingredient - Bourbon
  const testBourbon = {
    name: "Test Bourbon",
    description: "A test bourbon whiskey for cocktails",
    type: "spirit" as IngredientType,
    abv: 45.0,
    allergens: ["gluten"],
  };

  // Test data for second ingredient - Simple Syrup
  const testSimpleSyrup = {
    name: "Test Simple Syrup",
    description: "Equal parts sugar and water, heated and cooled",
    type: "syrup" as IngredientType,
    abv: 0,
  };

  // Test data for third ingredient - Angostura Bitters
  const testBitters = {
    name: "Test Angostura Bitters",
    description: "Classic aromatic bitters for cocktails",
    type: "bitter" as IngredientType,
    abv: 44.7,
    allergens: ["spices"],
  };

  // Store created ingredients references
  const createdIngredients: Ingredient[] = [];

  // Test creating ingredients
  await t.step("create multiple ingredients", async () => {
    // Create Bourbon
    const bourbon = await ingredientModel.create(testBourbon);

    assertExists(bourbon.id, "Ingredient should have an ID");
    assertEquals(bourbon.name, testBourbon.name);
    assertEquals(bourbon.type, "spirit");
    assertEquals(bourbon.abv, 45.0);
    assertEquals(bourbon.allergens?.length, 1);
    assertEquals(bourbon.allergens?.[0], "gluten");
    assertExists(bourbon.createdAt);
    assertExists(bourbon.updatedAt);

    createdIngredients.push(bourbon);

    // Create Simple Syrup
    const simpleSyrup = await ingredientModel.create(testSimpleSyrup);

    assertExists(simpleSyrup.id, "Ingredient should have an ID");
    assertEquals(simpleSyrup.name, testSimpleSyrup.name);
    assertEquals(simpleSyrup.type, "syrup");
    assertEquals(simpleSyrup.abv, 0);

    createdIngredients.push(simpleSyrup);

    // Create Bitters
    const bitters = await ingredientModel.create(testBitters);

    assertExists(bitters.id, "Ingredient should have an ID");
    assertEquals(bitters.name, testBitters.name);
    assertEquals(bitters.type, "bitter");
    assertEquals(bitters.abv, 44.7);

    createdIngredients.push(bitters);
  });

  // Test retrieving an ingredient
  await t.step("get ingredient by id", async () => {
    const ingredient = await ingredientModel.getById(createdIngredients[0].id);

    assertExists(ingredient);
    assertEquals(ingredient!.id, createdIngredients[0].id);
    assertEquals(ingredient!.name, testBourbon.name);
    assertEquals(ingredient!.type, testBourbon.type);
    assertEquals(ingredient!.abv, testBourbon.abv);
  });

  // Test updating an ingredient
  await t.step("update ingredient", async () => {
    const updatedIngredient = await ingredientModel.update(
      createdIngredients[0].id,
      {
        name: "Updated Test Bourbon",
        abv: 47.5,
      },
    );

    assertEquals(updatedIngredient.id, createdIngredients[0].id);
    assertEquals(updatedIngredient.name, "Updated Test Bourbon");
    assertEquals(updatedIngredient.abv, 47.5);
    // Type should remain the same
    assertEquals(updatedIngredient.type, testBourbon.type);
  });

  // Test listing ingredients
  await t.step("list all ingredients", async () => {
    const ingredients = await ingredientModel.listAll(10, 0);

    assertExists(ingredients);
    assertEquals(Array.isArray(ingredients), true);
    // Should find at least our three test ingredients
    assertEquals(ingredients.length >= 3, true);
  });

  // Test searching ingredients by type
  await t.step("get ingredients by type", async () => {
    // Search for spirits
    const spirits = await ingredientModel.getByType("spirit");

    assertExists(spirits);
    assertEquals(Array.isArray(spirits), true);
    assertEquals(spirits.length >= 1, true);

    // Check that our test bourbon is included
    const hasTestBourbon = spirits.some((i) => i.name.includes("Bourbon"));
    assertEquals(hasTestBourbon, true);

    // Search for syrups
    const syrups = await ingredientModel.getByType("syrup");

    assertExists(syrups);
    assertEquals(Array.isArray(syrups), true);
    assertEquals(syrups.length >= 1, true);

    // Check that our test simple syrup is included
    const hasSimpleSyrup = syrups.some((i) => i.name.includes("Simple Syrup"));
    assertEquals(hasSimpleSyrup, true);
  });

  // Test advanced search - by type
  await t.step("search by type", async () => {
    // Search for spirits
    const spirits = await ingredientModel.search({
      types: ["spirit"],
    });

    assertExists(spirits);
    assertEquals(spirits.length >= 1, true);

    // Check that our test bourbon is included
    const hasTestBourbon = spirits.some((i) => i.name.includes("Bourbon"));
    assertEquals(hasTestBourbon, true);

    // Search for multiple types at once
    const spiritsAndSyrups = await ingredientModel.search({
      types: ["spirit", "syrup"],
    });

    assertExists(spiritsAndSyrups);
    assertEquals(spiritsAndSyrups.length >= 2, true);

    // Check that our test bourbon and simple syrup are included
    const hasTestBourbon2 = spiritsAndSyrups.some((i) =>
      i.name.includes("Bourbon")
    );
    const hasSimpleSyrup = spiritsAndSyrups.some((i) =>
      i.name.includes("Simple Syrup")
    );
    assertEquals(hasTestBourbon2, true);
    assertEquals(hasSimpleSyrup, true);
  });

  // Test advanced search - by text query
  await t.step("search by text query", async () => {
    // Search for bourbon
    const bourbonResults = await ingredientModel.search({
      query: "bourbon",
    });

    assertExists(bourbonResults);
    assertEquals(Array.isArray(bourbonResults), true);
    assertEquals(bourbonResults.length >= 1, true);

    // Check that our test bourbon is included
    const hasTestBourbon = bourbonResults.some((i) =>
      i.name.includes("Bourbon")
    );
    assertEquals(hasTestBourbon, true);

    // Search for angostura
    const angosturaResults = await ingredientModel.search({
      query: "angostura",
    });

    assertExists(angosturaResults);
    assertEquals(Array.isArray(angosturaResults), true);
    assertEquals(angosturaResults.length >= 1, true);

    // Check that our test bitters are included
    const hasBitters = angosturaResults.some((i) =>
      i.name.includes("Angostura")
    );
    assertEquals(hasBitters, true);
  });

  // Test advanced search - by substitutes
  await t.step("search by substitutes", async () => {
    // Search for ingredients with substitutes
    const withSubstitutesResults = await ingredientModel.search({
      withSubstitutes: true,
    });

    assertExists(withSubstitutesResults);
    assertEquals(withSubstitutesResults.length >= 1, true);

    // Check that our updated bourbon is included (it has substitutes)
    const hasTestBourbon = withSubstitutesResults.some((i) =>
      i.id === createdIngredients[0].id
    );
    assertEquals(hasTestBourbon, true);
  });

  // Test advanced search - by allergens
  await t.step("search by allergens", async () => {
    // Search for ingredients with gluten allergen
    const glutenResults = await ingredientModel.search({
      withAllergens: ["gluten"],
    });

    assertExists(glutenResults);
    assertEquals(glutenResults.length >= 1, true);

    // Check that our test bourbon is included
    const hasTestBourbon = glutenResults.some((i) =>
      i.id === createdIngredients[0].id
    );
    assertEquals(hasTestBourbon, true);
  });

  // Test compound search with multiple criteria
  await t.step("compound search with multiple criteria", async () => {
    // Search for spirits with substitutes
    const spiritsWithSubstitutes = await ingredientModel.search({
      types: ["spirit"],
      withSubstitutes: true,
    });

    assertExists(spiritsWithSubstitutes);
    assertEquals(spiritsWithSubstitutes.length >= 1, true);

    // Check that our test bourbon is included
    const hasTestBourbon = spiritsWithSubstitutes.some((i) =>
      i.id === createdIngredients[0].id
    );
    assertEquals(hasTestBourbon, true);

    // Search for text query + type + has allergens
    const complexSearch = await ingredientModel.search({
      query: "bourbon",
      types: ["spirit"],
      withAllergens: ["gluten"],
    });

    assertExists(complexSearch);
    assertEquals(complexSearch.length >= 1, true);
    assertEquals(complexSearch[0].id, createdIngredients[0].id);
  });

  // Clean up - delete ingredients
  await t.step("delete ingredients", async () => {
    // Delete all created ingredients
    for (const ingredient of createdIngredients) {
      const result = await ingredientModel.delete(ingredient.id);
      assertEquals(result, true);

      const deletedIngredient = await ingredientModel.getById(ingredient.id);
      assertEquals(deletedIngredient, null);
    }
  });
});
