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
      <body data-theme="lofi">
        <div class="min-h-screen flex flex-col">
          {/* Navbar */}
          <div class="navbar bg-base-100">
            <div class="navbar-start">
              <div class="dropdown">
                <div tabIndex={0} role="button" class="btn btn-ghost lg:hidden">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h8m-8 6h16"
                    />
                  </svg>
                </div>
                <ul
                  tabIndex={0}
                  class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
                >
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
              <a class="btn btn-ghost text-xl" href="/">
                Barsistant
              </a>
            </div>
            <div class="navbar-center hidden lg:flex">
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
            <div class="navbar-end">
              {/* Dropdown menu removed as it's not needed yet */}
            </div>
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
      </body>
    </html>
  );
}
