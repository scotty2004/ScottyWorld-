/**
 * Talks to the Scotty_C bot panel (BOT_RUNTIME_ENDPOINT, e.g.
 * https://world.scottyhub.co.zw) which hosts the actual WhatsApp bot
 * process. ScottyWorld is the control surface; the panel is backend-only —
 * nothing here is shown to the user directly except through our own UI.
 *
 * The panel identifies a bot purely by WhatsApp phone number (it has no
 * concept of our database ids), so every call below is keyed by `phone`.
 * `ownerId` is our user id — passing it lets the panel enforce its own
 * 2-device-per-owner cap independently of our own plan limits.
 */

export type DeviceStatus = {
  phone: string;
  ownerId: string | null;
  status: "connected" | "pairing" | "reconnecting" | "expired" | "unpaired" | string;
  pairedAt: number | null;
  expiresAt: number | null;
  msLeft: number;
  countdown: string | null;
  expired: boolean;
};

function runtimeBase() {
  const endpoint = process.env.BOT_RUNTIME_ENDPOINT;
  const secret = process.env.BOT_RUNTIME_SECRET;
  if (!endpoint || !secret) throw new Error("BOT_RUNTIME_NOT_CONFIGURED");
  return { base: endpoint.replace(/\/$/, ""), secret };
}

async function runtimeFetch(path: string, init?: RequestInit) {
  const { base, secret } = runtimeBase();
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}`, ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `BOT_RUNTIME_${response.status}`);
  return data;
}

/** start / stop / restart / status for one paired number. */
export async function runtimeAction(phone: string, action: "start" | "stop" | "restart" | "status") {
  return runtimeFetch(`/bots/${encodeURIComponent(phone)}/${action}`, { method: "POST" });
}

export async function runtimeStatus(phone: string): Promise<DeviceStatus> {
  return runtimeFetch(`/bots/${encodeURIComponent(phone)}/status`, { method: "POST" });
}

/**
 * Pairs a WhatsApp number onto the panel.
 *   POST /pair  body: { phone, ownerId }
 *   200 -> { success: true, code }
 *   200 -> { success: false, status: "already_connected" }
 *   403 -> { success: false, status: "device_limit", error }
 *   4xx -> { success: false, error }
 */
export async function runtimePair(phone: string, ownerId?: string): Promise<{ code: string } | { alreadyConnected: true }> {
  const endpoint = process.env.BOT_RUNTIME_ENDPOINT;
  if (!endpoint) throw new Error("BOT_RUNTIME_NOT_CONFIGURED");

  const response = await fetch(`${endpoint.replace(/\/$/, "")}/pair`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, ownerId }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));

  if (data?.status === "already_connected") return { alreadyConnected: true };
  if (data?.status === "device_limit") { const e = new Error(data?.error || "Device limit reached."); (e as any).code = "DEVICE_LIMIT"; throw e; }
  if (!response.ok || !data?.success) throw new Error(data?.error || `The pairing panel returned an error (${response.status}).`);
  return { code: data.code };
}

/** Extends the panel-side hosting clock and reconnects the number if it had expired. */
export async function runtimeRenew(phone: string, ownerId?: string): Promise<DeviceStatus> {
  const data = await runtimeFetch(`/renew`, { method: "POST", body: JSON.stringify({ phone, ownerId }) });
  return data.device as DeviceStatus;
}

/** Permanently removes a paired number from the panel, freeing a device slot. */
export async function runtimeUnpair(phone: string, ownerId?: string) {
  return runtimeFetch(`/unpair`, { method: "POST", body: JSON.stringify({ phone, ownerId }) });
}

/** Every device the panel has paired for this owner, with live countdowns. */
export async function runtimeSessions(ownerId: string): Promise<{ devices: DeviceStatus[]; limit: number }> {
  return runtimeFetch(`/sessions?ownerId=${encodeURIComponent(ownerId)}`, { method: "GET" });
}
