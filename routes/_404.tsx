import { Head } from "$fresh/runtime.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <div class="hero min-h-screen bg-base-200">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <div class="flex justify-center">
              <img
                class="w-24 h-24 mb-6"
                src="/logo.svg"
                alt="Barsistant logo"
              />
            </div>
            <h1 class="text-5xl font-bold text-error">404</h1>
            <h2 class="text-2xl font-semibold mt-2">Page not found</h2>
            <p class="py-6">The page you were looking for doesn't exist.</p>
            <a href="/" class="btn btn-primary">
              Go back home
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
