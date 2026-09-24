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
 * Pairs a WhatsApp number onto the Scotty_C panel (BOT_RUNTIME_ENDPOINT, e.g.
 * https://world.scottyhub.co.zw). Matches that panel's actual `index.js`:
 *
 *   POST {BOT_RUNTIME_ENDPOINT}/pair
 *     body:  { phone: "263771234567" }        // digits only, no + or spaces
 *     200 -> { success: true, code: "ABCD-1234" }
 *     200 -> { success: false, status: "already_connected" }
 *     4xx -> { success: false, error: "human-readable message" }
 *
 * No auth header — the panel's /pair route doesn't check one. The code expires in 5
 * minutes (enforced panel-side); there's no per-phone status endpoint to poll, only an
 * aggregate one, so we don't try to detect "connected" from here.
 */
export async function runtimePair(phone: string): Promise<{ code: string } | { alreadyConnected: true }> {
  const endpoint = process.env.BOT_RUNTIME_ENDPOINT;
  if (!endpoint) throw new Error("BOT_RUNTIME_NOT_CONFIGURED");

  const response = await fetch(`${endpoint.replace(/\/$/, "")}/pair`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));

  if (data?.status === "already_connected") return { alreadyConnected: true };
  if (!response.ok || !data?.success) throw new Error(data?.error || `The pairing panel returned an error (${response.status}).`);
  return { code: data.code };
}
