import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth } from "@/lib/api";

export async function GET() {
  const user = await me();
  if (!user) return unauth();
  const [selling, bought, sales] = await Promise.all([
    db.marketplaceProduct.findMany({ where: { sellerId: user.id }, orderBy: { createdAt: "desc" }, select: { id: true, slug: true, title: true, type: true, priceCoins: true, status: true, _count: { select: { orders: true } } } }),
    db.order.findMany({ where: { buyerId: user.id, status: "PAID" }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true, amountCoins: true, product: { select: { id: true, slug: true, title: true, type: true } } } }),
    db.order.aggregate({ where: { status: "PAID", product: { sellerId: user.id } }, _sum: { sellerCoins: true, feeCoins: true }, _count: true }),
  ]);
  return NextResponse.json({ selling, bought, earnings: { coins: sales._sum.sellerCoins ?? 0, fees: sales._sum.feeCoins ?? 0, sales: sales._count } });
}
