import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";
import { productCreateSchema } from "@/lib/marketplace/validation";
import { rateLimit } from "@/lib/security/rate-limit";
import { getEntitlements } from "@/lib/pro/plans";
import { ECONOMY } from "@/lib/economy";

const TYPES = ["TEMPLATE", "APP", "BOT", "CODE", "PLUGIN", "THEME", "TOOL", "AI_TOOL", "DEV_RESOURCE"];

export async function GET(request: Request) {
  const user = await me();
  if (!user) return unauth();

  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim() || "";
  const type = url.searchParams.get("type");

  const products = await db.marketplaceProduct.findMany({
    where: {
      status: "PUBLISHED",
      ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }] } : {}),
      ...(type && TYPES.includes(type) ? { type: type as any } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true, slug: true, title: true, description: true, type: true, priceCoins: true, coverUrl: true, createdAt: true, sellerId: true,
      seller: { select: { username: true, displayName: true } },
      _count: { select: { reviews: true, orders: true } },
    },
  });

  return NextResponse.json({ products, feePercent: ECONOMY.MARKET_FEE_PERCENT });
}

export async function POST(request: Request) {
  const user = await me();
  if (!user) return unauth();
  if (!rateLimit(`marketplace-create:${user.id}`, 10, 60_000).allowed) return bad("Too many product submissions.", 429);

  const parsed = productCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return bad("Please check the form: title, description (10+ chars), category and price are required.");

  const ent = await getEntitlements(user.id);
  const listed = await db.marketplaceProduct.count({ where: { sellerId: user.id, status: { in: ["PUBLISHED", "DRAFT"] } } });
  if (ent.listings !== -1 && listed >= ent.listings) return bad(`Your plan allows ${ent.listings} listings. Upgrade to Pro to sell more.`, 403);

  let fileData = parsed.data.fileData ?? null;
  let fileName = parsed.data.fileName ?? null;
  if (parsed.data.botId) {
    const bot = await db.bot.findFirst({ where: { id: parsed.data.botId, ownerId: user.id }, select: { generatedFile: true, generatedFileName: true } });
    if (!bot?.generatedFile) return bad("That bot has no generated file to sell.");
    fileData = `data:text/javascript;base64,${Buffer.from(bot.generatedFile, "utf8").toString("base64")}`;
    fileName = bot.generatedFileName || "bot.js";
  }
  if (!fileData && !parsed.data.downloadUrl) return bad("Attach a file or provide a download link so buyers get something.");

  const base = (parsed.data.slug || parsed.data.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "item";
  let slug = base;
  for (let i = 0; i < 5 && (await db.marketplaceProduct.findUnique({ where: { slug }, select: { id: true } })); i++) slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  const product = await db.marketplaceProduct.create({
    data: {
      sellerId: user.id, title: parsed.data.title, slug, description: parsed.data.description, type: parsed.data.type,
      priceCoins: parsed.data.priceCoins, priceCents: parsed.data.priceCents ?? null, currency: parsed.data.currency,
      coverUrl: parsed.data.coverUrl ?? null, downloadUrl: parsed.data.downloadUrl ?? null, fileData, fileName,
      // published immediately — admins can suspend from the Control Center
      status: "PUBLISHED",
    },
    select: { id: true, slug: true },
  });
  return NextResponse.json({ product }, { status: 201 });
}
