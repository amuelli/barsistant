export default function Home() {
  return (
    <div class="hero min-h-screen bg-base-100">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <div class="flex justify-center">
            <img
              class="w-24 h-24 mb-6"
              src="/logo.svg"
              alt="Barsistant logo"
            />
          </div>
          <h1 class="text-5xl font-bold text-primary">Barsistant</h1>
          <p class="py-6">
            Your smart cocktail recipe assistant with AI-powered recipe
            extraction capabilities.
          </p>
          <div class="flex gap-4 justify-center">
            <a href="/recipes" class="btn btn-primary">
              Browse Recipes
            </a>
            <a href="/extract" class="btn btn-secondary">
              Add Recipe
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
