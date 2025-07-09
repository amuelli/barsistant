import { useSignal } from "@preact/signals";

export default function Login() {
  const email = useSignal("");
  const loading = useSignal(false);
  const message = useSignal("");
  const messageType = useSignal<"success" | "error" | "">("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!email.value.trim()) {
      message.value = "Please enter your email address";
      messageType.value = "error";
      return;
    }

    loading.value = true;
    message.value = "";
    messageType.value = "";

    try {
      const response = await fetch("/api/auth/request-magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.value.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        message.value = "Magic link sent! Check your email to sign in.";
        messageType.value = "success";
        email.value = "";
      } else {
        message.value = data.message || "Failed to send magic link";
        messageType.value = "error";
      }
    } catch (error) {
      console.error("Error:", error);
      message.value = "Network error. Please try again.";
      messageType.value = "error";
    } finally {
      loading.value = false;
    }
  };

  return (
    <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div class="card w-full max-w-md bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="text-center mb-6">
            <h1 class="text-3xl font-bold text-primary mb-2">
              🍸 Barsistant
            </h1>
            <p class="text-base-content/70">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} class="space-y-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Email address</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                class="input input-bordered w-full"
                value={email.value}
                onInput={(e) =>
                  email.value = (e.target as HTMLInputElement).value}
                disabled={loading.value}
                required
              />
            </div>

            {message.value && (
              <div
                class={`alert ${
                  messageType.value === "success"
                    ? "alert-success"
                    : "alert-error"
                }`}
              >
                <span>{message.value}</span>
              </div>
            )}

            <div class="form-control mt-6">
              <button
                type="submit"
                class="btn btn-primary w-full"
                disabled={loading.value}
              >
                {loading.value
                  ? (
                    <>
                      <span class="loading loading-spinner"></span>
                      Sending...
                    </>
                  )
                  : (
                    "Send Magic Link"
                  )}
              </button>
            </div>
          </form>

          <div class="divider">How it works</div>

          <div class="text-sm text-base-content/70 space-y-2">
            <p>• Enter your email address above</p>
            <p>• We'll send you a secure sign-in link</p>
            <p>• Click the link in your email to sign in</p>
            <p>• No password required!</p>
          </div>

          <div class="mt-6 text-center">
            <p class="text-sm text-base-content/50">
              New to Barsistant? Signing in will create your account
              automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
