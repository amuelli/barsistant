# Barsistant Project Requirements Document

## 1. Introduction

### 1.1 Purpose

This document outlines the requirements for the Barsistant project, a web
application designed to store and provide easy lookup of cocktail recipes with
AI-powered recipe extraction capabilities.

### 1.2 Project Scope

Barsistant aims to create a comprehensive cocktail recipe database with a unique
feature that allows users to easily add new recipes from various external
sources such as YouTube videos, websites, and other media using AI to extract
recipe information automatically.

### 1.3 Definitions and Acronyms

- AI: Artificial Intelligence
- API: Application Programming Interface
- UI: User Interface
- POS: Point of Sale

## 2. Overall Description

### 2.1 Product Perspective

Barsistant will be a web-based application that serves as a centralized
repository for cocktail recipes with advanced search and AI-powered recipe
extraction capabilities.

### 2.2 User Classes and Characteristics

- Cocktail Enthusiasts: Users looking for recipes and inspiration
- Professional Bartenders: Users seeking reliable references and recipe
  management
- Bar Owners/Managers: Users who want to maintain a consistent menu and train
  staff
- Content Creators: Users who create cocktail-related content and want to share
  recipes

### 2.3 Operating Environment

- Web-based application accessible on desktop and mobile browsers
- Modern web browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for various screen sizes

## 3. Specific Requirements

### 3.1 Functional Requirements

- Users must be able to search for cocktail recipes by name, ingredients, or
  characteristics
- Users must be able to add new recipes manually
- System must be able to extract recipe information from external sources
  (YouTube videos, websites) using AI
- Users must be able to save favorite recipes
- System must organize recipes into categories for easy browsing
- Users must be able to adjust recipe portions/serving sizes

### 3.2 Non-Functional Requirements

- Application should load recipe search results in under 2 seconds
- AI extraction must complete processing within 30 seconds of submission
- User interface must be intuitive and require minimal training
- System must be available 99% of the time
- All user data must be securely stored and encrypted

## 4. System Features

### 4.1 Recipe Management

- Create, read, update, and delete cocktail recipes
- Store recipe details including ingredients, measurements, preparation steps,
  and images
- Categorize recipes by type, base spirit, flavor profile, etc.
- Rate and review recipes
- Filter recipes by available ingredients

### 4.2 AI Recipe Extraction

- Accept URLs from YouTube, recipe websites, and other media sources
- Automatically extract recipe details including:
  - Ingredients and quantities
  - Preparation steps
  - Serving suggestions
  - Garnishes
- Allow user verification and editing of AI-extracted content before saving
- Learn from corrections to improve future extractions

### 4.3 Search and Discovery

- Advanced search functionality with multiple filters
- Recommendation engine based on user preferences and history
- Trending/popular recipe suggestions
- Seasonal recipe highlights

### 4.4 User Profile and Personalization

- User account creation and management
- Saved/favorite recipes collection
- Personal notes on recipes
- Custom recipe creation and storage
- Recipe sharing capabilities

### 4.5 Inventory Management

- Allow users to maintain a digital inventory of bar ingredients
- Track stock levels of spirits, mixers, garnishes, and other ingredients
- Set notifications for low inventory items
- Integration with recipe database to suggest cocktails based on available
  ingredients
- Optional: Track purchase history and costs
- Optional: Generate shopping lists based on planned recipes

## 5. External Interface Requirements

### 5.1 User Interfaces

- Clean, modern web interface with responsive design
- Mobile-friendly layouts for all features
- Accessible design meeting WCAG standards
- Intuitive recipe submission and editing forms
- Visual recipe representation (ingredients, steps, etc.)

### 5.2 Hardware Interfaces

- Compatible with standard web browsers on computers, tablets, and smartphones
- No specialized hardware required

### 5.3 Software Interfaces

- Integration with AI services for recipe extraction
- YouTube API for video processing
- Potential integration with social media platforms for sharing
- Handler functions using Fresh's routing system for data operations

## 6. Other Requirements

### 6.1 Performance Requirements

- Support for concurrent users (initial target: 1,000 simultaneous users)
- Database response time under 100ms for recipe queries
- Image optimization for fast page loading

### 6.2 Safety Requirements

- Appropriate age verification for alcoholic content
- Responsible drinking information and resources
- Allergen warnings for ingredients

### 6.3 Security Requirements

- Secure user authentication and authorization
- Protection against common web vulnerabilities (XSS, CSRF, SQL Injection)
- Regular security audits and updates
- Compliance with data protection regulations

## 7. Appendix

### 7.1 Timeline

- Project Start: April 12, 2025
- Design Phase: 4 weeks
- Development Phase: 16 weeks
- Testing Phase: 4 weeks
- Expected Initial Release: October 2025

### 7.2 Budget

- Development Resources: TBD
- AI Service Integration: TBD
- Hosting and Infrastructure: TBD
- Marketing and Launch: TBD

### 7.3 Stakeholders

- Project Owner
- Development Team
- Potential Bar/Restaurant Partners
- End Users (Bartenders and Cocktail Enthusiasts)

## 8. Technology Stack

### 8.1 Web Framework

**Fresh**: Full-stack web framework for Deno

- Server-side rendering with islands architecture
- Zero-config setup with hot reloading
- Efficient component hydration
- TypeScript by default
- Built-in Tailwind CSS integration
- Automatically uses Preact for components
- Zero-configuration deployments to Deno Deploy
- Built-in integration with the Deno ecosystem
- Automatic asset bundling and optimization
- Simple GitHub integration for continuous deployment
- Server-side rendering improves initial page load and SEO
- Islands architecture provides excellent performance characteristics
- Simple API route definitions for backend functionality

Fresh's tight integration with Deno Deploy and Tailwind CSS makes it the most
streamlined option for our application, with features like:

- Global CDN distribution
- Automatic scaling
- Zero cold starts (with appropriate plan)
- Built-in analytics
- Simplified SSL certificate management

### 8.2 Frontend Components

- **Preact**: Used by Fresh for component rendering
  - Lightweight alternative to React (3kB)
  - API compatible with React
  - Virtual DOM for efficient rendering
- **UI Technologies**:
  - Tailwind CSS for styling
    - Utility-first CSS framework
    - Component-friendly design system
    - Responsive design capabilities
    - Small bundle size with PurgeCSS
    - Easy theming and customization
  - **daisyUI**: Tailwind CSS component library
    - Pre-designed components with Tailwind flexibility
    - Theme customization with semantic color names
    - Integrated dark mode support
    - Production-ready components
  - Preact Signals for state management
  - Fresh routing for navigation

### 8.3 Frontend Framework and Libraries

- Fresh framework (`jsr:@fresh/core@^2.0.0-alpha.34`) for server-side rendering
  and routing
- Tailwind CSS v4 (`npm:tailwindcss@^4.1.7`) for styling, using
  `jsr:@pakornv/fresh-plugin-tailwindcss@2.0.0-alpha.1`
- DaisyUI v5 (`npm:daisyui@^5.0.43`) for component library and theming,
  configured via CSS:

  ```css
  @import "tailwindcss";

  @plugin "daisyui" {
    themes: ["lofi"];
  }
  ```

- Preact (`npm:preact@^10.26.6`) for component development
- Preact Signals (`@preact/signals@1.2.2`) for state management
- CSS modules for component-specific styling when needed
- Design system focused on clean, minimalist aesthetic using lofi theme

### 8.4 Runtime Environment

- **Deno**: Modern JavaScript/TypeScript runtime
  - Built-in TypeScript support
  - Web-standard APIs

### 8.5 Database Solution

**Deno KV**: Built-in key-value database for Deno

- Native integration with Deno and Deno Deploy
- Zero configuration needed
- Globally distributed across multiple data centers
- Strong consistency by default (with optional eventual consistency)
- Support for transactions, secondary indexes, and watch functionality
- Seamless integration with the Deno ecosystem
- No additional services or authentication required
- Transaction support for maintaining data integrity
- Simplifies deployment with no external database dependencies

The data modeling approach uses:

- Primary keys for recipes: `["recipe", recipeId]` → recipe data
- Primary keys for ingredients: `["ingredient", ingredientId]` → ingredient data
- Recipe tags: `["tag_recipes", tag, recipeId]` → recipe reference
- Recipe strength: `["strength_recipes", strength, recipeId]` → recipe reference
- Recipe sweetness: `["sweetness_recipes", sweetness, recipeId]` → recipe
  reference
- Ingredient types: `["ingredient_type", type, ingredientId]` → ingredient
  reference
- Ingredient search: `["ingredient_search", term, ingredientId]` → true
- Ingredient allergens: `["ingredient_allergen", allergen, ingredientId]` → true
- User favorites: `["user_favorites", userId, recipeId]` → timestamp data
- User inventory: `["user_inventory", userId, ingredientId]` → quantity data
- User recipe notes: `["user_notes", userId, recipeId]` → notes data
- Magic link tokens: `["auth_tokens", token]` → token data with email and
  expiration
- User sessions: `["user_sessions", sessionId]` → session data
- User session lookup: `["user_session_lookup", userId, sessionId]` → true
- User email lookup: `["user_emails", email]` → userId

This structure enables:

- Efficient recipe and ingredient lookups by ID
- Fast filtering by tags, strength, and sweetness
- Quick ingredient searching and filtering
- Robust user data management
- Secure authentication state management

### 8.5 Data Access Patterns

The implementation supports these key access patterns:

1. Recipe Operations:
   - Get by ID: `KV.get(["recipe", recipeId])`
   - List all: `KV.list({ prefix: ["recipe"] })`
   - Filter by tag: `KV.list({ prefix: ["tag_recipes", tag] })`
   - Filter by strength: `KV.list({ prefix: ["strength_recipes", strength] })`
   - Filter by sweetness:
     `KV.list({ prefix: ["sweetness_recipes", sweetness] })`

2. Ingredient Operations:
   - Get by ID: `KV.get(["ingredient", ingredientId])`
   - List all: `KV.list({ prefix: ["ingredient"] })`
   - Filter by type: `KV.list({ prefix: ["ingredient_type", type] })`
   - Search by term: `KV.list({ prefix: ["ingredient_search", term] })`
   - Filter by allergen:
     `KV.list({ prefix: ["ingredient_allergen", allergen] })`

3. User Operations:
   - Get favorites: `KV.list({ prefix: ["user_favorites", userId] })`
   - Get inventory: `KV.list({ prefix: ["user_inventory", userId] })`
   - Get recipe notes: `KV.list({ prefix: ["user_notes", userId] })`
   - Validate session: `KV.get(["user_sessions", sessionId])`
   - Look up by email: `KV.get(["user_emails", email])`

All database operations are performed using atomic transactions where necessary
to maintain data consistency, and are wrapped in error handling utilities
provided by the `executeDbOperation` function.

### 8.6 AI Service Integration

**AI SDK**: Provider-agnostic AI framework for recipe extraction

- Provider Flexibility: Compatible with multiple AI providers (OpenAI,
  Anthropic, etc.)
- Deno Compatibility: Works natively with Deno's ESM imports
- Easy Integration: Simple API that aligns with Deno's modern JavaScript
  approach
- Provider Switching: Allows changing AI providers without significant code
  changes
- Structured Output: Supports JSON mode for structured recipe data extraction

The AI SDK will be used to extract recipe information from various web sources,
including:

- Recipe websites
- YouTube video descriptions
- Blog posts
- Social media content

The implementation using Fresh's handler functions follows these steps:

1. Recipe extraction handler receives URL in request
2. Fetch webpage content using Deno's native fetch API
3. Extract relevant text content using an HTML parser
4. Process the content through the AI SDK to identify recipe components:
   - Recipe name
   - Ingredients and measurements
   - Preparation steps
   - Garnish information
   - Glassware recommendations
5. Return structured data to be validated by the user before saving

Example implementation pattern:

```typescript
import { OpenAI } from "https://esm.sh/ai";

// Can be easily switched to another provider
const ai = new OpenAI({
  apiKey: Deno.env.get("AI_API_KEY"),
});

export default async function ExtractHandler(req: Request, ctx: FreshContext) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { url } = await req.json();

    // Fetch and parse webpage content
    const response = await fetch(url);
    const htmlContent = await response.text();
    const textContent = extractTextFromHtml(htmlContent);

    // Use AI to extract structured recipe data
    const result = await ai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Extract cocktail recipe details from the provided content.",
        },
        {
          role: "user",
          content: textContent,
        },
      ],
      response_format: { type: "json_object" },
    });

    const extractedRecipe = JSON.parse(result.choices[0].message.content);
    return ctx.render({ recipe: extractedRecipe });
  } catch (error) {
    return new Response(error.message, { status: 400 });
  }
}
```

This approach enables us to:

1. Handle extraction requests directly in Fresh routes
2. Process content from various sources with a unified approach
3. Structure the extracted data consistently regardless of source
4. Render results server-side for better performance
5. Provide immediate user feedback

### 8.7 Deployment Considerations

- **Deno Deploy**: Native deployment platform for Fresh applications
  - Global edge network
  - One-click deployments from GitHub
  - Built specifically for Deno applications
  - Zero configuration required for Fresh projects
  - Automatic HTTPS
  - Integrated monitoring

### 8.8 Authentication System

**Magic Links Authentication**: Simple, passwordless authentication system

- Email-based authentication without passwords
- User-friendly login experience with minimal friction
- Enhanced security by removing password management challenges
- Built on top of the existing Deno KV database
- Time-limited tokens for security

The magic links authentication system will work as follows:

1. User enters their email address in the login form
2. System generates a secure, unique token associated with the email
3. Token is stored in Deno KV with an expiration time (typically 15 minutes)
4. System sends an email containing a special authentication link with the token
5. User clicks the link in their email which validates the token
6. If valid and not expired, the system creates a session for the user
7. User is redirected to the application in an authenticated state

This approach provides several benefits:

- Eliminates password-related security risks and user frustration
- Reduces development time by avoiding password management complexity
- Prevents credential stuffing and brute force attacks
- Utilizes existing infrastructure (Deno KV) for token storage
- Provides good user experience with minimal steps

Example data structure for token storage:

```typescript
interface MagicLinkToken {
  email: string;
  userId?: string; // For returning users
  expires: number; // Timestamp when token expires
  used: boolean; // To prevent token reuse
}

// Key structure in Deno KV
// ["auth_tokens", token] → MagicLinkToken
```

Example session data structure:

```typescript
interface UserSession {
  userId: string;
  email: string;
  created: number; // Timestamp when session was created
  expires: number; // Timestamp when session expires
  lastActive: number; // Timestamp of last activity
}

// Key structure in Deno KV
// ["user_sessions", sessionId] → UserSession
// ["user_session_lookup", userId, sessionId] → true
```

## 9. Development Approach

### 9.1 Development Methodology

- Agile development with iterative cycles
- Focus on delivering core features first (MVP approach)
- Regular review and refinement

### 9.2 Version Control

- Git for source control
- GitHub for repository hosting and collaboration

### 9.3 Testing Strategy

- Unit testing with Deno's built-in test runner
- Component testing for Preact components
- Integration testing for API endpoints
- E2E testing for critical user flows

## 10. Example Data Structures

### 10.1 Recipe Data Structure

Below is an example of how cocktail recipes could be structured in the database,
using two classic cocktails as examples:

```typescript
// Recipe type definition
interface Recipe {
  id: string;
  name: string;
  description: string;
  strength: number; // Scale of 1-10
  sweetness: number; // Scale of 1-10 (1 = very sour, 10 = very sweet)
  ingredients: Ingredient[];
  garnish: string[];
  glassware: string;
  preparation: string[];
  source: {
    name: string;
    url?: string;
  };
  tags: string[];
  image?: string;
  rating?: number; // Average user rating
  calories?: number;
  alcoholContent?: {
    percentage: number;
    standardDrinks: number;
  };
  allergens?: string[];
}

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  optional: boolean;
  substitutes?: string[];
}

// Example recipes
const exampleRecipes = [
  {
    id: "old-fashioned-diffords",
    name: "Old Fashioned Cocktail (Difford's recipe)",
    description:
      "Achieving balance, ideal dilution and a good chill are essential to the enjoyment of this spirituous sublime classic.",
    strength: 9,
    sweetness: 6,
    ingredients: [
      {
        name: "Bourbon whiskey",
        quantity: "45",
        unit: "ml",
        optional: false,
      },
      {
        name: "Straight rye whiskey",
        quantity: "30",
        unit: "ml",
        optional: false,
        substitutes: ["Additional bourbon"],
      },
      {
        name: "Demerara/Muscovado/brown sugar syrup",
        quantity: "10",
        unit: "ml",
        optional: false,
        substitutes: ["Simple syrup"],
      },
      {
        name: "Bob's Abbotts bitters",
        quantity: "8",
        unit: "drop",
        optional: false,
        substitutes: ["Angostura bitters"],
      },
      {
        name: "Saline solution",
        quantity: "3",
        unit: "drop",
        optional: true,
      },
    ],
    garnish: ["Orange zest twist"],
    glassware: "Old-fashioned glass",
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
    },
    tags: ["classic", "whiskey", "spirit-forward", "nightcap", "hall-of-fame"],
    image: "/images/recipes/old-fashioned.jpg",
    calories: 213,
    alcoholContent: {
      percentage: 32.65,
      standardDrinks: 2.3,
    },
  },
  {
    id: "amaretto-sour",
    name: "Amaretto Sour",
    description:
      "Sweet 'n' sour - frothy with an almond buzz. An extra couple of dashes of bitters help balance the drink and add an extra burst of flavour.",
    strength: 3,
    sweetness: 5,
    ingredients: [
      {
        name: "Disaronno amaretto",
        quantity: "60",
        unit: "ml",
        optional: false,
      },
      {
        name: "Lemon juice (freshly squeezed)",
        quantity: "30",
        unit: "ml",
        optional: false,
      },
      {
        name: "Angostura Aromatic Bitters",
        quantity: "1",
        unit: "dash",
        optional: false,
      },
      {
        name: "Egg white (pasteurised)",
        quantity: "15",
        unit: "ml",
        optional: false,
        substitutes: [
          "Aquafaba (chickpea water)",
          "Fee Brothers Fee Foam cocktail foamer",
        ],
      },
    ],
    garnish: ["Lemon slice", "Luxardo Maraschino Cherry"],
    glassware: "Old-fashioned glass",
    preparation: [
      "Pre-chill an Old-fashioned glass.",
      "SHAKE all ingredients with ice.",
      "STRAIN back into shaker.",
      "DRY SHAKE (without ice).",
      "FINE STRAIN into ice-filled glass.",
      "Spray aromatic bitters over foaming cocktail from atomiser and then garnish with lemon slice & Luxardo Maraschino Cherry on stick.",
    ],
    source: {
      name: "Difford's Guide",
      url: "https://www.diffordsguide.com/cocktails/recipe/53/amaretto-sour",
    },
    tags: ["sour", "citrusy", "frothy", "amaretto", "egg-white"],
    image: "/images/recipes/amaretto-sour.jpg",
    calories: 233,
    alcoholContent: {
      percentage: 11.83,
      standardDrinks: 1,
    },
    allergens: ["Eggs"],
  },
];
```

### 10.2 Data Access Patterns

The data structure above supports the following key access patterns:

1. Recipe lookup by ID: `KV.get(["recipe", "old-fashioned-diffords"])`
2. Recipe search by ingredient:
   `KV.list({ prefix: ["ingredient_recipes", "Bourbon whiskey"] })`
3. Recipe search by tags: `KV.list({ prefix: ["tag_recipes", "sour"] })`
4. Recipe search by strength/sweetness:
   `KV.list({ prefix: ["strength_recipes", 3] })`

The AI extraction component would generate structured data in this format from
unstructured sources, making it easy to integrate new recipes from various
online sources into the application's database.
