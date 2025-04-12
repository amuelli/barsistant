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
- RESTful API for potential future mobile app development

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
    - Provides pre-designed components while maintaining Tailwind's flexibility
    - Theme customization with semantic color names
    - Reduces custom component development time
    - Can be integrated with Fresh projects as discussed in
      https://github.com/saadeghi/daisyui/discussions/2629
  - Preact Signals for state management
  - Fresh routing for navigation

### 8.3 Runtime Environment

- **Deno**: Modern JavaScript/TypeScript runtime
  - Built-in TypeScript support
  - Enhanced security with permissions system
  - Native ESM modules support
  - Built-in testing and formatting tools
  - Web-standard APIs

### 8.4 Database Solution

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

The data modeling approach for recipe-inventory matching will use:

- Primary keys for recipes: `["recipe", recipeId]` → recipe data
- Primary keys for ingredients: `["ingredient", ingredientId]` → ingredient data
- Recipe-ingredient relationships:
  `["recipe_ingredient", recipeId, ingredientId]` → quantity data
- Secondary indexes for efficient querying:
  `["ingredient_recipes", ingredientId, recipeId]` → recipe reference

This structure will enable efficient querying to find recipes based on available
ingredients, which is a core feature of the application.

### 8.5 AI Service Integration

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

The implementation will follow these steps:

1. Fetch webpage content using Deno's native fetch API
2. Extract relevant text content using an HTML parser
3. Process the content through the AI SDK to identify recipe components:
   - Recipe name
   - Ingredients and measurements
   - Preparation steps
   - Garnish information
   - Glassware recommendations
4. Return structured data to be validated by the user before saving

Example implementation pattern:

```typescript
import { OpenAI } from "https://esm.sh/ai";

// Can be easily switched to another provider
const ai = new OpenAI({
  apiKey: Deno.env.get("AI_API_KEY"),
});

async function extractRecipeFromUrl(url: string) {
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

  return JSON.parse(result.choices[0].message.content);
}
```

This approach enables us to:

1. Work with any provider supported by the AI SDK
2. Process content from various sources with a unified approach
3. Structure the extracted data consistently regardless of source
4. Easily switch providers if needed for cost, performance, or feature reasons

### 8.6 Deployment Considerations

- **Deno Deploy**: Native deployment platform for Fresh applications
  - Global edge network
  - One-click deployments from GitHub
  - Built specifically for Deno applications
  - Zero configuration required for Fresh projects
  - Automatic HTTPS
  - Integrated monitoring

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
