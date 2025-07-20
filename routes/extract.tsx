import { page } from "fresh";
import RecipeExtractor from "../islands/RecipeExtractor.tsx";
import { define } from "../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    ctx.state.title = "Extract Recipe";

    return page();
  },
});

export default define.page<typeof handler>(
  ({ state }) => {
    const user = state.user;
    const isAuthenticated = !!user;

    return (
      <div class="container mx-auto p-4">
        <h1 class="text-4xl font-bold mb-6">Extract Recipe</h1>

        {isAuthenticated
          ? (
            <>
              <p class="mb-6">
                Add recipes from external sources by pasting the URL below.
                We'll use AI to extract the recipe details.
              </p>

              <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                  <RecipeExtractor user={user} />
                </div>
              </div>
            </>
          )
          : (
            <div class="max-w-2xl mx-auto">
              <div class="hero min-h-[400px] bg-base-200 rounded-lg">
                <div class="hero-content text-center">
                  <div class="max-w-md">
                    <div class="mb-6">
                      <svg
                        class="w-16 h-16 mx-auto mb-4 text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25"
                        />
                      </svg>
                    </div>
                    <h2 class="text-3xl font-bold mb-4">
                      AI-Powered Recipe Extraction
                    </h2>
                    <p class="mb-6 text-base-content/80">
                      Transform any online recipe into a structured format with
                      our AI assistant. Simply paste a URL and we'll extract all
                      the ingredients, instructions, and details for you.
                    </p>

                    <div class="space-y-4 mb-6 text-left">
                      <div class="flex items-start gap-3">
                        <svg
                          class="w-5 h-5 text-success mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Extract recipes from any website or blog</span>
                      </div>
                      <div class="flex items-start gap-3">
                        <svg
                          class="w-5 h-5 text-success mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          Automatically organize ingredients and instructions
                        </span>
                      </div>
                      <div class="flex items-start gap-3">
                        <svg
                          class="w-5 h-5 text-success mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Generate beautiful recipe images with AI</span>
                      </div>
                    </div>

                    <a href="/auth/login" class="btn btn-primary btn-lg">
                      Sign In to Extract Recipes
                    </a>

                    <p class="text-sm text-base-content/60 mt-4">
                      New to Barsistant? Signing in will create your account
                      automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    );
  },
);
