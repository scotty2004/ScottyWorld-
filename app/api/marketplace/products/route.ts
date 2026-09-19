import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { db } from "../../../../../lib/db";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id: slug } = await context.params;
  const product = await db.marketplaceProduct.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      seller: { select: { username: true, displayName: true } },
      reviews: { orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { username: true, displayName: true } } } },
      _count: { select: { orders: true, reviews: true } },
    },
  });

  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product });
}
