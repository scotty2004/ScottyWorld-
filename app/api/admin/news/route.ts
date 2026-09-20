import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guards";
import { writeAdminAudit } from "@/lib/admin/audit";

const ROLES = ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"] as const;
const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "article";

export async function GET() {
  try { await requireAdmin([...ROLES]); } catch { return forbidden(); }
  const articles = await db.newsArticle.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ articles });
}

const schema = z.object({
  title: z.string().trim().min(5).max(200),
  excerpt: z.string().trim().max(300).optional(),
  content: z.string().trim().min(20).max(30_000),
  category: z.string().trim().min(2).max(40),
  sourceName: z.string().trim().max(80).optional(),
  sourceUrl: z.string().url().max(500).optional().or(z.literal("")),
  imageUrl: z.string().max(400_000).optional().or(z.literal("")),
  publish: z.boolean().default(true),
});

/** Only admins can post news. */
export async function POST(req: Request) {
  let admin; try { admin = await requireAdmin([...ROLES]); } catch { return forbidden(); }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Title (5+), category and content (20+ chars) are required." }, { status: 400 });
  const d = parsed.data;
  let slug = slugify(d.title);
  if (await db.newsArticle.findUnique({ where: { slug }, select: { id: true } })) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  const article = await db.newsArticle.create({
    data: { title: d.title, slug, excerpt: d.excerpt || d.content.slice(0, 160), content: d.content, category: d.category, sourceName: d.sourceName || null, sourceUrl: d.sourceUrl || null, imageUrl: d.imageUrl || null, status: d.publish ? "PUBLISHED" : "DRAFT", publishedAt: d.publish ? new Date() : null },
  });
  await writeAdminAudit({ userId: admin.id, action: "NEWS_POSTED", entity: "NewsArticle", entityId: article.id, metadata: { title: article.title } });
  return NextResponse.json({ article }, { status: 201 });
}

export async function DELETE(req: Request) {
  let admin; try { admin = await requireAdmin([...ROLES]); } catch { return forbidden(); }
  const { id } = await req.json().catch(() => ({}));
  if (typeof id !== "string") return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  await db.newsArticle.delete({ where: { id } });
  await writeAdminAudit({ userId: admin.id, action: "NEWS_DELETED", entity: "NewsArticle", entityId: id });
  return NextResponse.json({ ok: true });
}
