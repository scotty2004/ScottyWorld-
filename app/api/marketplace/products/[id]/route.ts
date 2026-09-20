import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth } from "@/lib/api";
import { ECONOMY } from "@/lib/economy";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();

  const { id: slug } = await context.params;
  const product = await db.marketplaceProduct.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true, slug: true, title: true, description: true, type: true, priceCoins: true, coverUrl: true, createdAt: true, sellerId: true, fileName: true,
      seller: { select: { username: true, displayName: true } },
      reviews: { orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { username: true, displayName: true } } } },
      _count: { select: { orders: true, reviews: true } },
    },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  // never expose the download link/file here — only via the gated /download route
  const owned = product.sellerId === user.id || Boolean(await db.order.findFirst({ where: { buyerId: user.id, productId: product.id, status: "PAID" }, select: { id: true } }));
  return NextResponse.json({ product, owned, isSeller: product.sellerId === user.id, feePercent: ECONOMY.MARKET_FEE_PERCENT });
}
