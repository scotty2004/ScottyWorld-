import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const planId = typeof body.planId === "string" ? body.planId : "";
  const plan = await db.proPlan.findFirst({ where: { id: planId, active: true } });
  if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

  // Provider-agnostic placeholder: never marks a subscription paid without provider confirmation.
  const subscription = await db.subscription.create({
    data: { userId: user.id, planId: plan.id, status: "TRIALING", provider: "pending" },
  });

  return NextResponse.json({
    subscription,
    message: "Subscription intent created. Connect a payment provider webhook to activate billing.",
  }, { status: 201 });
}
