import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { db } from "../../../../lib/db";
import { productCreateSchema } from "../../../../lib/marketplace/validation";
import { rateLimit } from "../../../../lib/security/rate-limit";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim() || "";
  const type = url.searchParams.get("type");

  const products = await db.marketplaceProduct.findMany({
    where: {
      status: "PUBLISHED",
      ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }] } : {}),
      ...(type && ["TEMPLATE","APP","BOT","CODE","PLUGIN","THEME","TOOL","AI_TOOL","DEV_RESOURCE"].includes(type) ? { type: type as any } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, slug: true, title: true, description: true, type: true,
      priceCoins: true, priceCents: true, currency: true, coverUrl: true, createdAt: true,
      seller: { select: { username: true, displayName: true } },
      _count: { select: { reviews: true, orders: true } },
    },
  });

  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const limit = rateLimit(`marketplace-create:${user.id}`, 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many product submissions." }, { status: 429 });

  const parsed = productCreateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid product.", issues: parsed.error.flatten() }, { status: 400 });

  const existing = await db.marketplaceProduct.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return NextResponse.json({ error: "That product slug is already used." }, { status: 409 });

  const product = await db.marketplaceProduct.create({
    data: {
      sellerId: user.id,
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      type: parsed.data.type,
      priceCoins: parsed.data.priceCoins,
      priceCents: parsed.data.priceCents ?? null,
      currency: parsed.data.currency,
      coverUrl: parsed.data.coverUrl ?? null,
      downloadUrl: parsed.data.downloadUrl ?? null,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
