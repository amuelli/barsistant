import { openai } from "@ai-sdk/openai";

export class AIError extends Error {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message);
    this.name = "AIError";
  }
}

const PROVIDER = Deno.env.get("AI_PROVIDER") || "openai";
const MODEL = Deno.env.get("AI_MODEL") ||
  (PROVIDER === "openai" ? "gpt-4o" : undefined);

export function getModel() {
  switch (PROVIDER) {
    case "openai":
      return openai(MODEL || "gpt-4o");
    // case "anthropic":
    //   return anthropic(MODEL || "claude-3-opus-20240229");
    default:
      throw new AIError(`Unknown AI provider: ${PROVIDER}`);
  }
}

export async function executeAIOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new AIError(errorMessage, error);
  }
}
