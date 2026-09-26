import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const article = await db.newsArticle.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!article) return NextResponse.json({ error: "Article not found." }, { status: 404 });
  return NextResponse.json({ article });
}
