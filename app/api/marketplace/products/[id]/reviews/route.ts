import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/marketplace/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  const purchased = await db.order.findFirst({ where: { buyerId: user.id, productId: id, status: "PAID" } });
  if (!purchased) return NextResponse.json({ error: "Only verified purchasers can review this product." }, { status: 403 });

  const parsed = reviewSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid review." }, { status: 400 });

  const review = await db.productReview.upsert({
    where: { productId_userId: { productId: id, userId: user.id } },
    create: { productId: id, userId: user.id, rating: parsed.data.rating, body: parsed.data.body || null },
    update: { rating: parsed.data.rating, body: parsed.data.body || null },
  });

  return NextResponse.json({ review });
}
