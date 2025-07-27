import { useSignal } from "@preact/signals";

export default function Login() {
  const email = useSignal("");
  const code = useSignal("");
  const loading = useSignal(false);
  const message = useSignal("");
  const messageType = useSignal<"success" | "error" | "">("");
  const showCodeInput = useSignal(false);

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
        message.value =
          "Magic link sent! Check your email and enter the code below.";
        messageType.value = "success";
        showCodeInput.value = true;
        // Don't clear email, keep it filled for code verification
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

  const handleCodeSubmit = (e: Event) => {
    e.preventDefault();

    // Validate code
    const cleanCode = code.value.replace(/[\s-]/g, "");
    if (cleanCode.length !== 8) {
      message.value = "Please enter the 8-digit code from your email";
      messageType.value = "error";
      return;
    }

    // Redirect to verify with both email and code
    const verifyUrl = `/auth/verify?code=${
      encodeURIComponent(code.value.trim())
    }&email=${encodeURIComponent(email.value.trim())}`;
    globalThis.location.href = verifyUrl;
  };

  const handleCodeChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const value = input.value.replace(/[^\d-]/g, ""); // Only allow digits and dash
    code.value = value;

    // Auto-submit when we have a complete code (8 digits, with or without dash)
    const cleanCode = value.replace(/-/g, "");
    if (cleanCode.length === 8) {
      handleCodeSubmit(e);
    }
  };

  return (
    <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div class="card w-full max-w-md bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="text-center mb-6">
            <div class="flex justify-center mb-3">
              <svg
                width="40"
                height="40"
                viewBox="0 0 250 250"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M173.822 25.0431C167.553 25.832 160.907 29.4952 156.469 34.6079C151.98 39.7786 149.851 45.5199 149.851 52.4525C149.851 58.5258 151.479 63.9004 154.758 68.6486C158.036 73.3953 162.336 76.6357 168.327 78.8714C171.529 80.0667 171.556 80.0707 176.758 80.0782C182.687 80.0867 185.134 79.575 189.409 77.4337C193.456 75.407 195.856 73.5004 198.601 70.1314C205.52 61.6399 206.791 49.8766 201.851 40.05C200.56 37.4809 197.564 33.6211 195.327 31.6424C192.348 29.008 187.812 26.6672 183.516 25.5472C181.335 24.9784 176.384 24.7208 173.822 25.0431ZM175.497 38.1519C174.642 38.8252 174.638 38.8503 174.638 43.3975C174.638 45.9228 174.487 48.2492 174.3 48.5983C173.993 49.1726 173.581 49.2298 169.752 49.2298C165.772 49.2298 165.492 49.2729 164.627 50.0177C163.36 51.1089 163.317 53.3913 164.541 54.6161C165.3 55.3762 165.67 55.4605 168.944 55.6214C173.562 55.8484 173.947 55.9424 174.323 56.9334C174.496 57.3889 174.638 59.5632 174.638 61.7652C174.638 65.5277 174.683 65.8112 175.392 66.4786C176.471 67.4927 178.827 67.4683 179.799 66.4329C180.458 65.7305 180.508 65.3508 180.508 61.0636C180.508 55.2283 180.309 55.4337 185.977 55.4337C189.809 55.4337 190.033 55.3965 190.796 54.6321C191.819 53.6091 191.886 51.6447 190.941 50.4418C190.303 49.6304 190.16 49.6037 185.859 49.4998C181.925 49.4048 181.381 49.3225 180.97 48.7593C180.624 48.2845 180.508 46.9895 180.508 43.6015C180.508 39.234 180.481 39.0502 179.708 38.2766C178.676 37.2432 176.724 37.1854 175.497 38.1519ZM47.4646 61.0701C45.4132 61.6023 44.4798 64.3836 45.7328 66.2311C46.0453 66.6924 48.0073 69.1169 50.0923 71.6187C52.1774 74.1208 60.4695 84.1114 68.5193 93.8201C76.5691 103.529 86.4574 115.447 90.4934 120.305C94.5294 125.163 99.446 131.103 101.419 133.505C103.392 135.907 107.186 140.518 109.85 143.753C115.034 150.05 115.667 151.03 116.423 153.939C117.17 156.811 117.15 204.057 116.4 206.584C115.8 208.608 113.777 210.988 112.237 211.483C111.167 211.828 99.6469 214.309 90.0619 216.259C84.0175 217.489 83.197 217.786 82.2286 219.096C81.1736 220.523 81.3282 222.403 82.6057 223.682L83.6568 224.735L120.912 224.817C157.693 224.899 158.181 224.892 159.236 224.246C161.161 223.067 161.554 220.362 160.043 218.693C159.063 217.611 159.857 217.81 139.098 213.452C134.708 212.531 130.576 211.501 129.916 211.164C128.221 210.298 126.849 208.488 126.239 206.313C125.781 204.676 125.717 201.428 125.721 179.817C125.724 153.667 125.727 153.621 127.292 150.557C127.675 149.807 130.087 146.648 132.651 143.537C135.215 140.425 139.092 135.676 141.266 132.982C143.44 130.289 148.062 124.632 151.536 120.411C166.796 101.877 177.899 88.092 177.899 87.6815C177.899 87.598 176.615 87.4458 175.045 87.3436C173.476 87.2417 171.47 86.9759 170.588 86.7532C169.042 86.3627 168.961 86.3777 168.305 87.1692C167.932 87.6208 166.575 89.224 165.291 90.7319C160.38 96.4996 151.175 107.426 146.478 113.065C132.15 130.264 125.823 137.545 124.44 138.423C123.245 139.181 122.617 139.35 120.98 139.35C118.366 139.35 116.729 138.29 113.748 134.67C112.541 133.203 109.851 129.946 107.77 127.432C101.531 119.893 96.3851 113.655 92.4343 108.84C88.3689 103.885 83.8489 98.4224 69.6204 81.2651C64.5081 75.1007 60.2764 69.9257 60.2167 69.7653C60.1531 69.5955 78.5384 69.4741 104.331 69.4741H148.554L147.271 66.9204C146.566 65.516 145.74 63.6068 145.437 62.6779L144.885 60.9888L96.6545 60.9052C70.1278 60.8588 47.9923 60.9333 47.4646 61.0701Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-primary mb-2">
              Barsistant
            </h1>
            <p class="text-base-content/70">Sign in to your account</p>
          </div>

          <form
            onSubmit={showCodeInput.value ? handleCodeSubmit : handleSubmit}
            class="space-y-4"
          >
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
                disabled={loading.value || showCodeInput.value}
                required
              />
            </div>

            {showCodeInput.value && (
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Verification code</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9\-\s]{9,11}"
                  maxLength={9}
                  placeholder="1234-5678"
                  class="input input-bordered text-center text-2xl font-mono tracking-wider"
                  value={code.value}
                  onInput={handleCodeChange}
                  disabled={loading.value}
                  autocomplete="one-time-code"
                  autofocus
                />
                <label class="label">
                  <span class="label-text-alt">Format: 1234-5678</span>
                </label>
              </div>
            )}

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
                  : showCodeInput.value
                  ? "Verify Code"
                  : "Send Magic Link"}
              </button>
            </div>

            {showCodeInput.value && (
              <div class="text-center">
                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  onClick={() => {
                    showCodeInput.value = false;
                    code.value = "";
                    message.value = "";
                    messageType.value = "";
                  }}
                >
                  Use a different email
                </button>
              </div>
            )}
          </form>

          {!showCodeInput.value && (
            <>
              <div class="divider">How it works</div>

              <div class="text-sm text-base-content/70 space-y-2">
                <p>• Enter your email address above</p>
                <p>• We'll send you a secure sign-in link and code</p>
                <p>• Click the link or enter the code to sign in</p>
                <p>• No password required!</p>
              </div>
            </>
          )}

          {showCodeInput.value && (
            <>
              <div class="divider">Options</div>

              <div class="text-sm text-base-content/70 space-y-2">
                <p>• Check your email for the magic link button</p>
                <p>• Or enter the 8-digit code above to sign in</p>
                <p>• The code expires in 15 minutes</p>
              </div>
            </>
          )}

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
