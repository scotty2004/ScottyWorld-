export type AiContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type AiMessage = { role: "system" | "user" | "assistant"; content: string | AiContentPart[] };

export type ChatAttachment = { key: string; name: string; type: string; size: number };

const TEXT_LIKE = /^(text\/|application\/(json|xml|javascript|x-httpd-php))|\.(txt|md|json|js|jsx|ts|tsx|py|java|c|cpp|h|css|html|csv|log|yml|yaml|env|sh)$/i;
const MAX_INLINE_TEXT_BYTES = 60_000; // ~ a few thousand tokens, keeps the prompt sane
const MAX_INLINE_IMAGE_BYTES = 6 * 1024 * 1024; // most vision-capable models cap around this

/**
 * Turns an uploaded attachment into content the model can actually use:
 *  - images   -> inlined as a base64 data URL (vision-capable models only)
 *  - text/code -> inlined as a fenced snippet (capped, to keep the prompt small)
 *  - anything else (zip, binaries…) -> a plain description; models can't read raw binary,
 *    so we tell the user that in the UI rather than pretending the AI opened it.
 */
export async function attachmentToPart(att: ChatAttachment): Promise<AiContentPart> {
  const { openObject } = await import("@/lib/integrations/storage");
  const isImage = att.type.startsWith("image/");
  const isTextLike = TEXT_LIKE.test(att.type) || TEXT_LIKE.test(att.name);

  if (isImage && att.size <= MAX_INLINE_IMAGE_BYTES) {
    try {
      const obj = await openObject(att.key, null);
      const chunks: Buffer[] = [];
      const reader = obj.body.getReader();
      for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(Buffer.from(value)); }
      const b64 = Buffer.concat(chunks).toString("base64");
      return { type: "image_url", image_url: { url: `data:${att.type || "image/png"};base64,${b64}` } };
    } catch {
      return { type: "text", text: `[Attached image "${att.name}" could not be read.]` };
    }
  }

  if (isTextLike && att.size <= MAX_INLINE_TEXT_BYTES) {
    try {
      const obj = await openObject(att.key, null);
      const chunks: Buffer[] = [];
      const reader = obj.body.getReader();
      for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(Buffer.from(value)); }
      const text = Buffer.concat(chunks).toString("utf8").slice(0, MAX_INLINE_TEXT_BYTES);
      return { type: "text", text: `Attached file "${att.name}" (${att.type || "text"}, ${att.size} bytes):\n\`\`\`\n${text}\n\`\`\`` };
    } catch {
      return { type: "text", text: `[Attached file "${att.name}" could not be read.]` };
    }
  }

  return {
    type: "text",
    text: isImage
      ? `[Attached image "${att.name}" (${att.size} bytes) is larger than ${Math.round(MAX_INLINE_IMAGE_BYTES / 1024 / 1024)} MB, so it wasn't sent to the AI.]`
      : `[Attached file "${att.name}" (${att.type || "unknown type"}, ${att.size} bytes). I can't read the raw contents of this file type (e.g. zip/binary) — describe what's in it and I can help.]`,
  };
}

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
