import webpush from "web-push";

let configured = false;

function ensureConfigured() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@scottyworld.local";

  if (!publicKey || !privateKey) throw new Error("PUSH_NOT_CONFIGURED");

  if (!configured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || null;
}

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function sendPushNotification(
  subscription: PushSubscriptionInput,
  payload: { title: string; body: string; url?: string }
) {
  ensureConfigured();

  try {
    await webpush.sendNotification(subscription as any, JSON.stringify(payload));
    return true;
  } catch (err: any) {
    // 404/410 means the subscription is gone (user revoked permission,
    // uninstalled, etc.) — the caller should delete it from the database.
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      throw new Error("PUSH_SUBSCRIPTION_EXPIRED");
    }
    throw err;
  }
}
