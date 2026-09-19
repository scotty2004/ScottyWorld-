import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const take = Math.min(Number(url.searchParams.get("limit") || 20), 50);

  const articles = await db.newsArticle.findMany({
    where: { status: "PUBLISHED", ...(category ? { category } : {}) },
    orderBy: { publishedAt: "desc" },
    take,
  });

  return NextResponse.json({ articles });
}
