import { PageProps } from "fresh";
import AuthNav from "🏝️/AuthNav.tsx";
import AuthProvider from "🏝️/AuthProvider.tsx";
import { checkAdminFromUser } from "🛠️/auth/admin.ts";
import { State } from "🛠️/define.ts";

export default function App(
  { Component, state, url }: PageProps<unknown, State>,
) {
  // User is now available from middleware via state
  const user = state.user;
  const isAdmin = checkAdminFromUser(user);

  return (
    <AuthProvider initialUser={user}>
      <AppContent
        Component={Component}
        state={state}
        url={url}
        isAdmin={isAdmin}
      />
    </AuthProvider>
  );
}

function AppContent(
  { Component, state, isAdmin }: {
    Component: preact.ComponentType<unknown>;
    state: State;
    url: URL;
    isAdmin: boolean;
  },
) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        {state.title
          ? <title>Barsistant - {state.title}</title>
          : <title>Barsistant</title>}
        <link rel="stylesheet" href="/styles.css" />
        <link rel="manifest" href="/manifest.json"></link>
      </head>
      <body data-theme="barsistant">
        <div class="min-h-screen flex flex-col">
          {/* Regular content */}
          <div class="flex flex-col bg-base-100 flex-grow">
            {/* Navbar - Hidden on mobile, visible on lg screens */}
            <div class="hidden lg:flex navbar bg-base-100 w-full">
              <a class="btn btn-ghost text-xl px-2" href="/">
                Barsistant
              </a>
              <div class="flex-1 flex justify-center">
                <ul class="menu menu-horizontal px-1">
                  <li>
                    <a href="/">Home</a>
                  </li>
                  <li>
                    <a href="/recipes">
                      {state.user ? "My Recipes" : "Recipes"}
                    </a>
                  </li>
                  <li>
                    <a href="/extract">Extract Recipe</a>
                  </li>
                </ul>
              </div>
              <div class="flex-none">
                <AuthNav user={state.user} isAdmin={isAdmin} />
              </div>
            </div>

            {/* Main content */}
            <main class="flex-grow pb-16 lg:pb-0 md:pt-2 lg:pt-0">
              <Component />
            </main>
            {/* Footer */}
            <footer class="footer p-10 pb-24 lg:pb-10 bg-neutral text-neutral-content">
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
                  {state.user ? "My Recipes" : "Recipes"}
                </a>
                <a class="link link-hover" href="/extract">
                  Extract Recipe
                </a>
              </nav>
            </footer>
          </div>

          {/* Mobile dock navigation */}
          <div class="dock bg-base-200 lg:hidden fixed bottom-0 left-0 right-0">
            <a href="/" class="aria-[current=page]:dock-active">
              <svg
                class="size-[1.2em]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
              <span class="dock-label">Home</span>
            </a>
            <a
              href="/recipes"
              class="aria-[current]:dock-active"
            >
              <svg
                class="size-[1.2em]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              <span class="dock-label">
                {state.user ? "My Recipes" : "Recipes"}
              </span>
            </a>
            <a
              href="/extract"
              class="aria-[current]:dock-active"
            >
              <svg
                class="size-[1.2em]"
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
              <span class="dock-label">Extract</span>
            </a>
            {state.user && isAdmin && (
              <a
                href="/admin"
                class="aria-[current]:dock-active"
              >
                <svg
                  class="size-[1.2em]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span class="dock-label">Admin</span>
              </a>
            )}
            {state.user
              ? (
                <a
                  href="/profile"
                  class="aria-[current]:dock-active"
                >
                  <div class="w-5 h-5 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs">
                    {state.user.displayName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span class="dock-label">Profile</span>
                </a>
              )
              : (
                <a
                  href="/auth/login"
                  class="aria-[current]:dock-active"
                >
                  <svg
                    class="size-[1.2em]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                  <span class="dock-label">Sign In</span>
                </a>
              )}
          </div>
        </div>
      </body>
    </html>
  );
}
