import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

interface VerifyCodeProps {
  initialMessage?: string;
}

export default function VerifyCode({ initialMessage }: VerifyCodeProps) {
  const code = useSignal("");
  const email = useSignal("");
  const message = useSignal(initialMessage || "");
  const messageType = useSignal<"success" | "error" | "">("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get email from URL parameters if available
    const urlParams = new URLSearchParams(globalThis.location.search);
    const emailParam = urlParams.get("email");
    if (emailParam) {
      email.value = emailParam;
    }

    // Focus the code input on mount
    inputRef.current?.focus();
  }, []);

  const handleCodeChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const value = input.value.replace(/[^\d-]/g, ""); // Only allow digits and dash
    code.value = value;

    // Auto-submit when we have a complete code (8 digits, with or without dash)
    const cleanCode = value.replace(/-/g, "");
    if (cleanCode.length === 8) {
      handleSubmit(e);
    }
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    if (!email.value.trim()) {
      message.value = "Please enter your email address";
      messageType.value = "error";
      return;
    }

    const cleanCode = code.value.replace(/[\s-]/g, "");
    if (cleanCode.length !== 8) {
      message.value = "Please enter the 8-digit code from your email";
      messageType.value = "error";
      return;
    }

    // Submit form with code as URL parameter to use the same flow as magic link
    const verifyUrl = `/auth/verify?code=${
      encodeURIComponent(code.value.trim())
    }&email=${encodeURIComponent(email.value.trim())}`;
    globalThis.location.href = verifyUrl;
  };

  return (
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Enter Verification Code</h2>
      <p class="text-sm text-base-content/70">
        Enter the 8-digit code from your email
      </p>

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
            onInput={(e) => email.value = (e.target as HTMLInputElement).value}
            required
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Verification code</span>
          </label>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9\-\s]{9,11}"
            maxLength={9}
            placeholder="1234-5678"
            class="input input-bordered text-center text-2xl font-mono tracking-wider"
            value={code.value}
            onInput={handleCodeChange}
            autocomplete="one-time-code"
          />
          <label class="label">
            <span class="label-text-alt">Format: 1234-5678</span>
          </label>
        </div>

        {message.value && (
          <div
            class={`alert ${
              messageType.value === "success" ? "alert-success" : "alert-error"
            }`}
          >
            <span>{message.value}</span>
          </div>
        )}

        <div class="form-control mt-6">
          <button
            type="submit"
            class="btn btn-primary w-full"
          >
            Verify Code
          </button>
        </div>
      </form>

      <div class="divider">OR</div>

      <a href="/auth/login" class="btn btn-outline btn-primary w-full">
        Request New Code
      </a>
    </div>
  );
}
