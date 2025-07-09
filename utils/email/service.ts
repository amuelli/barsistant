/**
 * Email service using Resend
 */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("FROM_EMAIL") || "hello@barsistant.com";
  const fromName = Deno.env.get("FROM_NAME") || "Barsistant";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${response.status} ${error}`);
  }
}
