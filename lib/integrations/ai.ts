export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

export async function askScotty(messages: AiMessage[], options?: { temperature?: number }) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) throw new Error("AI_NOT_CONFIGURED");

  const endpoint = process.env.AI_API_URL || "https://openrouter.ai/api/v1/chat/completions";
  const model = process.env.AI_MODEL || "openai/gpt-4o-mini";
  const siteUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://scottyworld.local";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // OpenRouter uses these (optional but recommended) to attribute usage
      // to the calling app; harmless no-ops against other OpenAI-compatible
      // providers if AI_API_URL is overridden.
      "HTTP-Referer": siteUrl,
      "X-Title": "ScottyWorld",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.2,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`AI_PROVIDER_${response.status}`);
  }

  const data = await response.json();
  return String(data?.choices?.[0]?.message?.content || "");
}
