import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, type PaymentEvent } from "@/lib/integrations/payments";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-webhook-signature");
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  try {
    const event = JSON.parse(raw) as PaymentEvent;
    if (!event.id || !event.type) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

    // Idempotency can be backed by AuditLog until a dedicated PaymentEvent
    // table is introduced. Replayed event IDs are ignored.
    const existing = await prisma.auditLog.findFirst({
      where: { action: "PAYMENT_WEBHOOK_RECEIVED", entity: "PaymentEvent", entityId: event.id },
      select: { id: true },
    });
    if (existing) return NextResponse.json({ received: true, duplicate: true });

    if (event.subscriptionId && event.status) {
      const allowed = ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELLED", "EXPIRED"];
      if (allowed.includes(event.status)) {
        await prisma.subscription.updateMany({
          where: { id: event.subscriptionId },
          data: { status: event.status as any },
        });
      }
    }

    if (event.userId) {
      await prisma.auditLog.create({
        data: {
          userId: event.userId,
          action: "PAYMENT_WEBHOOK_RECEIVED",
          entity: "PaymentEvent",
          entityId: event.id,
          metadata: event as any,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}
