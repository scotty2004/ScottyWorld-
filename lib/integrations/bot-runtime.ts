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
