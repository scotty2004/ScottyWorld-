type RuntimeAction = "start" | "stop" | "restart" | "status";

export async function runtimeAction(botId: string, action: RuntimeAction) {
  const endpoint = process.env.BOT_RUNTIME_ENDPOINT;
  const secret = process.env.BOT_RUNTIME_SECRET;
  if (!endpoint || !secret) throw new Error("BOT_RUNTIME_NOT_CONFIGURED");

  const response = await fetch(`${endpoint.replace(/\/$/, "")}/bots/${encodeURIComponent(botId)}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`BOT_RUNTIME_${response.status}`);
  return response.json();
}

/**
 * Starts WhatsApp pairing for a bot on the runtime panel (BOT_RUNTIME_ENDPOINT, e.g.
 * http://panel.scottyhub.co.zw:3002). The panel must implement:
 *
 *   POST {BOT_RUNTIME_ENDPOINT}/bots/{botId}/pair
 *     headers: Authorization: Bearer {BOT_RUNTIME_SECRET}
 *     body:    { phone: "+263771234567", fileUrl: "https://.../api/bots/{botId}/file?token=..." }
 *     200 ->   { pairingCode: "ABCD-1234", expiresIn: 60 }
 *     4xx/5xx -> { error: "human-readable message" }
 *
 * fileUrl is a short-lived link the panel uses to fetch this bot's generated .js file so it
 * can actually launch the Baileys session — the panel process has no other way to read it,
 * since the normal /api/bots/{id}/file route requires the owner's browser session cookie.
 */
export async function runtimePair(botId: string, phone: string, fileUrl: string) {
  const endpoint = process.env.BOT_RUNTIME_ENDPOINT;
  const secret = process.env.BOT_RUNTIME_SECRET;
  if (!endpoint || !secret) throw new Error("BOT_RUNTIME_NOT_CONFIGURED");

  const response = await fetch(`${endpoint.replace(/\/$/, "")}/bots/${encodeURIComponent(botId)}/pair`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ phone, fileUrl }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `BOT_RUNTIME_${response.status}`);
  return data as { pairingCode: string; expiresIn?: number; sessionId?: string };
}
