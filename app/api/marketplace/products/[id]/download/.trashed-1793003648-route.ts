import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth } from "@/lib/api";

/** Only the seller or a paying buyer can download. Free items (0 SC) require sign-in only. */
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  const { id } = await ctx.params;
  const p = await db.marketplaceProduct.findFirst({ where: { id, status: { in: ["PUBLISHED", "ARCHIVED"] } }, select: { id: true, sellerId: true, priceCoins: true, downloadUrl: true, fileData: true, fileName: true } });
  if (!p) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const allowed = p.sellerId === user.id || p.priceCoins === 0 || Boolean(await db.order.findFirst({ where: { buyerId: user.id, productId: p.id, status: "PAID" }, select: { id: true } }));
  if (!allowed) return NextResponse.json({ error: "Purchase required." }, { status: 403 });

  if (p.fileData) {
    const m = /^data:([\w.+-]+\/[\w.+-]+);base64,([\s\S]*)$/.exec(p.fileData);
    if (m) {
      return new NextResponse(Buffer.from(m[2], "base64"), {
        headers: { "Content-Type": m[1], "Content-Disposition": `attachment; filename="${(p.fileName || "download").replace(/[^a-zA-Z0-9._-]/g, "_")}"`, "Cache-Control": "private, no-store" },
      });
    }
  }
  if (p.downloadUrl) return NextResponse.redirect(p.downloadUrl);
  return NextResponse.json({ error: "No file attached." }, { status: 404 });
}
