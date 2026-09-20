/**
 * Optional seed: npm run db:seed
 * Creates the Pro plans, the official channels, starter FAQ and starter coin tasks.
 * Safe to run more than once.
 */
import { PrismaClient } from "@prisma/client";
import { PLAN_CATALOG } from "../lib/pro/plans";
import { DEFAULT_CHANNELS, DEFAULT_FAQ, DEFAULT_TASKS } from "../lib/defaults";

const db = new PrismaClient();

async function main() {
  for (const p of PLAN_CATALOG) {
    await db.proPlan.upsert({
      where: { slug: p.slug },
      update: { name: p.name, description: p.description, priceCents: p.priceCents, features: p.features, limits: p.limits },
      create: { slug: p.slug, name: p.name, description: p.description, interval: "MONTHLY", priceCents: p.priceCents, features: p.features, limits: p.limits },
    });
  }
  if ((await db.channel.count()) === 0) await db.channel.createMany({ data: DEFAULT_CHANNELS.map((c) => ({ name: c.name, platform: c.platform, url: c.url, description: c.description })) });
  if ((await db.faqItem.count()) === 0) await db.faqItem.createMany({ data: DEFAULT_FAQ.map((f, i) => ({ ...f, sortOrder: i })) });
  if ((await db.coinTask.count()) === 0) await db.coinTask.createMany({ data: DEFAULT_TASKS.map((t) => ({ ...t })) });
  console.log("Seed complete.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
