import { PageProps } from "fresh";
import { State } from "../utils.ts";

export default function App({ Component, state }: PageProps<unknown, State>) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {state.title
          ? <title>Barsistant - {state.title}</title>
          : <title>Barsistant</title>}
        <link rel="stylesheet" href="/styles.css" />
        <link rel="manifest" href="/manifest.json"></link>
      </head>
      <body data-theme="barsistant">
        <div class="min-h-screen flex flex-col">
          <div class="drawer">
            <input id="main-drawer" type="checkbox" class="drawer-toggle" />
            <div class="drawer-content flex flex-col bg-base-100">
              {/* Navbar */}
              <div class="navbar bg-base-100 w-full">
                <div class="flex-none lg:hidden">
                  <label
                    for="main-drawer"
                    aria-label="open sidebar"
                    class="btn btn-square btn-ghost"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      class="inline-block h-6 w-6 stroke-current"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      >
                      </path>
                    </svg>
                  </label>
                </div>
                <a class="btn btn-ghost text-xl px-2" href="/">
                  Barsistant
                </a>
                <div class="hidden flex-1 lg:flex justify-center">
                  <ul class="menu menu-horizontal px-1">
                    <li>
                      <a href="/">Home</a>
                    </li>
                    <li>
                      <a href="/recipes">Recipes</a>
                    </li>
                    <li>
                      <a href="/extract">Extract Recipe</a>
                    </li>
                  </ul>
                </div>
                <div class="flex-none lg:hidden"></div>
              </div>
              {/* Main content */}
              <main class="flex-grow">
                <Component />
              </main>
              {/* Footer */}
              <footer class="footer p-10 bg-neutral text-neutral-content">
                <aside>
                  <p>
                    Barsistant
                    <br />
                    Your smart cocktail recipe assistant
                  </p>
                </aside>
                <nav>
                  <h6 class="footer-title">Links</h6>
                  <a class="link link-hover" href="/">
                    Home
                  </a>
                  <a class="link link-hover" href="/recipes">
                    Recipes
                  </a>
                  <a class="link link-hover" href="/extract">
                    Extract Recipe
                  </a>
                </nav>
              </footer>
            </div>
            <div class="drawer-side">
              <label
                for="main-drawer"
                aria-label="close sidebar"
                class="drawer-overlay"
              >
              </label>
              <ul class="menu bg-base-200 min-h-full w-80 p-4">
                <li>
                  <a href="/">Home</a>
                </li>
                <li>
                  <a href="/recipes">Recipes</a>
                </li>
                <li>
                  <a href="/extract">Extract Recipe</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
