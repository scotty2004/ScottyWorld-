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


/**
 * Streaming variant: returns a ReadableStream of plain-text chunks so the chat UI
 * can render the answer as it is generated (feels like a real messaging app).
 */
export async function streamScotty(messages: AiMessage[], options?: { temperature?: number }): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) throw new Error("AI_NOT_CONFIGURED");
  const endpoint = process.env.AI_API_URL || "https://openrouter.ai/api/v1/chat/completions";
  const model = process.env.AI_MODEL || "openai/gpt-4o-mini";
  const siteUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://scottyworld.local";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "HTTP-Referer": siteUrl, "X-Title": "ScottyWorld" },
    body: JSON.stringify({ model, messages, temperature: options?.temperature ?? 0.3, stream: true }),
    cache: "no-store",
  });
  if (!response.ok || !response.body) throw new Error(`AI_PROVIDER_${response.status}`);

  const dec = new TextDecoder();
  const enc = new TextEncoder();
  const reader = response.body.getReader();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) { controller.close(); return; }
      buffer += dec.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const payload = t.slice(5).trim();
        if (payload === "[DONE]") { controller.close(); return; }
        try {
          const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta) controller.enqueue(enc.encode(delta));
        } catch { /* ignore keep-alives / partial JSON */ }
      }
    },
    cancel() { reader.cancel().catch(() => {}); },
  });
}
