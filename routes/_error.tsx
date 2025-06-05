import { HttpError, PageProps } from "fresh";

export default function ErrorPage(props: PageProps) {
  const error = props.error; // Contains the thrown Error or HTTPError

  console.error("Error occurred:", error);
  if (error instanceof HttpError) {
    const status = error.status; // HTTP status code

    // Render a 404 not found page
    if (status === 404) {
      return <NotFoundPage />;
    }
    if (status === 500) {
      return <InternalServerErrorPage />;
    }
    // For other HTTP errors, you can customize the message
    return <ErrorBoundary error={error} />;
  }

  return <InternalServerErrorPage />;
}

function NotFoundPage() {
  return (
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
  );
}

function InternalServerErrorPage() {
  return (
    <div class="hero min-h-screen bg-base-200">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-5xl font-bold text-error">500</h1>
          <h2 class="text-2xl font-semibold mt-2">Internal Server Error</h2>
          <p class="py-6">
            Something went wrong on our end. Please try again later.
          </p>
          <a href="/" class="btn btn-primary">
            Go back home
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorBoundary(props: { error: Error }) {
  return (
    <div class="hero min-h-screen bg-base-200">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-5xl font-bold text-error">Error</h1>
          <p class="py-6">{props.error.message}</p>
          <a href="/" class="btn btn-primary">
            Go back home
          </a>
        </div>
      </div>
    </div>
  );
}
