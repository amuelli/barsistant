import { APP_SHELL_MARKER } from "../contracts/app_shell.ts";
import { ImportUrlForm } from "./import_url_form.tsx";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <main
        className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-16 sm:px-10"
        data-app-shell={APP_SHELL_MARKER}
      >
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Barsistant
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">
            Save cocktail recipes from anywhere.
          </h1>
          <p className="max-w-xl text-lg text-zinc-600">
            A personal recipe collection focused on quick capture, reliable
            source attribution, and a clean mixing view.
          </p>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            Phase 1 deployability baseline
          </h2>
          <p className="mt-2 text-zinc-600">
            App shell is live and monitored by health and smoke checks. Convex
            integration and URL import flow are the next slices.
          </p>
          <a
            className="mt-4 inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            href="/api/health"
          >
            Verify API health
          </a>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            Tracer bullet: URL import submission
          </h2>
          <p className="mt-2 text-zinc-600">
            Submit a recipe URL to exercise the first end-to-end import path.
            Current behavior returns a queued placeholder response.
          </p>
          <ImportUrlForm />
        </section>
      </main>
    </div>
  );
}
