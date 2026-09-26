import crypto from "node:crypto";

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export type PaymentEvent = {
  id: string;
  type: string;
  userId?: string;
  subscriptionId?: string;
  status?: string;
};
