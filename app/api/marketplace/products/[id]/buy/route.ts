import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";
import { ECONOMY, marketFee } from "@/lib/economy";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();

  const { id } = await context.params;
  const product = await db.marketplaceProduct.findFirst({ where: { id, status: "PUBLISHED" }, select: { id: true, sellerId: true, title: true, priceCoins: true } });
  if (!product) return bad("Product not found.", 404);
  if (product.sellerId === user.id) return bad("You cannot purchase your own product.");
  if (product.priceCoins <= 0) return bad("This item is free — just download it.");

  const price = product.priceCoins;
  const fee = marketFee(price);
  const sellerGets = price - fee;
  const treasury = await db.user.findFirst({ where: { role: "SUPER_ADMIN" }, orderBy: { createdAt: "asc" }, select: { id: true } });

  try {
    const order = await db.$transaction(
      async (tx) => {
        const owned = await tx.order.findFirst({ where: { buyerId: user.id, productId: id, status: "PAID" }, select: { id: true } });
        if (owned) throw new Error("OWNED");
        const sum = await tx.coinTransaction.aggregate({ where: { userId: user.id }, _sum: { amount: true } });
        const balance = sum._sum.amount ?? 0;
        if (balance < price) throw new Error(`INSUFFICIENT:${balance}`);

        const created = await tx.order.create({ data: { buyerId: user.id, productId: id, status: "PAID", amountCoins: price, feeCoins: fee, sellerCoins: sellerGets } });
        await tx.coinTransaction.create({ data: { userId: user.id, amount: -price, type: "SPEND", reason: `Purchase: ${product.title}`, reference: `order:${created.id}` } });
        await tx.coinTransaction.create({ data: { userId: product.sellerId, amount: sellerGets, type: "EARN", reason: `Sale: ${product.title}`, reference: `order:${created.id}` } });
        if (fee > 0 && treasury && treasury.id !== product.sellerId) {
          await tx.coinTransaction.create({ data: { userId: treasury.id, amount: fee, type: "EARN", reason: `Marketplace fee (${ECONOMY.MARKET_FEE_PERCENT}%): ${product.title}`, reference: `order:${created.id}` } });
        }
        await tx.notification.create({ data: { userId: product.sellerId, type: "MARKETPLACE", title: "You made a sale", body: `${product.title} sold for ${price} SC — you earned ${sellerGets} SC.` } });
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json({ order, fee, sellerGets });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "OWNED") return bad("You already own this product.", 409);
    if (msg.startsWith("INSUFFICIENT")) return NextResponse.json({ error: "Insufficient Scotty Coins.", balance: Number(msg.split(":")[1]), required: price }, { status: 402 });
    return bad("Purchase could not be completed.", 500);
  }
}
