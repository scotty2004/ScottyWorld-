import { db } from "@/lib/db";

export async function globalSearch(query: string, limit = 8) {
  const q = query.trim();
  if (!q) return [];

  const take = Math.min(Math.max(limit, 1), 20);
  const [products, courses, posts, news, bots] = await Promise.all([
    db.marketplaceProduct.findMany({
      where: { status: "PUBLISHED", OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] },
      take,
      select: { id: true, name: true, slug: true, description: true },
    }),
    db.course.findMany({
      where: { status: "PUBLISHED", OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] },
      take,
      select: { id: true, title: true, slug: true, description: true },
    }),
    db.post.findMany({
      where: { OR: [{ title: { contains: q, mode: "insensitive" } }, { content: { contains: q, mode: "insensitive" } }] },
      take,
      select: { id: true, title: true, content: true, type: true },
    }),
    db.newsArticle.findMany({
      where: { status: "PUBLISHED", OR: [{ title: { contains: q, mode: "insensitive" } }, { excerpt: { contains: q, mode: "insensitive" } }] },
      take,
      select: { id: true, title: true, slug: true, excerpt: true, category: true },
    }),
    db.bot.findMany({
      where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] },
      take,
      select: { id: true, name: true, slug: true, description: true, status: true },
    }),
  ]);

  return [
    ...products.map((x) => ({ kind: "marketplace", id: x.id, title: x.name, href: `/marketplace/${x.slug}`, description: x.description })),
    ...courses.map((x) => ({ kind: "academy", id: x.id, title: x.title, href: `/academy/${x.slug}`, description: x.description })),
    ...posts.map((x) => ({ kind: "community", id: x.id, title: x.title || "Community post", href: `/community?post=${x.id}`, description: x.content?.slice(0, 180), type: x.type })),
    ...news.map((x) => ({ kind: "news", id: x.id, title: x.title, href: `/news/${x.slug}`, description: x.excerpt, category: x.category })),
    ...bots.map((x) => ({ kind: "bot", id: x.id, title: x.name, href: `/bots/${x.slug}`, description: x.description, status: x.status })),
  ].slice(0, take * 5);
}
