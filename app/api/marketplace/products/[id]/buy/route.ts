import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { db } from "../../../../../../lib/db";
import { addCoinTransaction, getCoinBalance } from "../../../../../../lib/coins/service";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  const product = await db.marketplaceProduct.findFirst({
    where: { id, status: "PUBLISHED" },
    select: { id: true, sellerId: true, title: true, priceCoins: true },
  });

  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  if (product.sellerId === user.id) return NextResponse.json({ error: "You cannot purchase your own product." }, { status: 400 });
  if (product.priceCoins <= 0) return NextResponse.json({ error: "This product requires the configured payment provider." }, { status: 400 });

  const existing = await db.order.findFirst({ where: { buyerId: user.id, productId: id, status: "PAID" } });
  if (existing) return NextResponse.json({ error: "You already own this product." }, { status: 409 });

  const balance = await getCoinBalance(user.id);
  if (balance < product.priceCoins) return NextResponse.json({ error: "Insufficient Scotty Coins.", balance, required: product.priceCoins }, { status: 402 });

  try {
    const order = await db.$transaction(async tx => {
      const created = await tx.order.create({
        data: { buyerId: user.id, productId: id, status: "PAID", amountCoins: product.priceCoins },
      });
      await tx.coinTransaction.create({
        data: { userId: user.id, amount: -product.priceCoins, type: "SPEND", reason: `Marketplace purchase: ${product.title}`, reference: created.id },
      });
      return created;
    });

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Purchase could not be completed." }, { status: 500 });
  }
}
