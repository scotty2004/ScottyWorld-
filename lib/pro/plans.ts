import { db } from "@/lib/db";

export type Entitlements = {
  tier: "FREE" | "SILVER" | "BRONZE" | "GOLD" | "PLATINUM";
  aiDaily: number;          // Scotty AI messages per day (-1 = unlimited)
  bots: number;             // bots you can own (-1 = unlimited)
  cloudMb: number;          // Scotty Cloud storage
  listings: number;         // marketplace listings
  taskBonusPct: number;     // % extra coins on approved tasks
  freeBotGeneration: boolean;
  prioritySupport: boolean;
  badge: string | null;
};

export const FREE_ENTITLEMENTS: Entitlements = {
  tier: "FREE", aiDaily: 20, bots: 1, cloudMb: 100, listings: 3,
  taskBonusPct: 0, freeBotGeneration: false, prioritySupport: false, badge: null,
};

/** Default plan catalogue — seeded into ProPlan and used as a fallback. */
export const PLAN_CATALOG: Array<{
  slug: string; name: string; description: string; priceCents: number; features: string[]; limits: Omit<Entitlements, "tier">; tier: Entitlements["tier"];
}> = [
  { slug: "silver", name: "Silver", tier: "SILVER", priceCents: 100,
    description: "Everything you need to get more out of ScottyWorld.",
    features: ["60 Scotty AI messages / day", "2 bots", "1 GB Scotty Cloud", "10 marketplace listings", "+5% coins on tasks", "Silver badge"],
    limits: { aiDaily: 60, bots: 2, cloudMb: 1024, listings: 10, taskBonusPct: 5, freeBotGeneration: false, prioritySupport: false, badge: "silver" } },
  { slug: "bronze", name: "Bronze", tier: "BRONZE", priceCents: 200,
    description: "For builders shipping bots and projects regularly.",
    features: ["150 Scotty AI messages / day", "3 bots", "3 GB Scotty Cloud", "25 marketplace listings", "+10% coins on tasks", "Bronze badge"],
    limits: { aiDaily: 150, bots: 3, cloudMb: 3072, listings: 25, taskBonusPct: 10, freeBotGeneration: false, prioritySupport: false, badge: "bronze" } },
  { slug: "gold", name: "Gold", tier: "GOLD", priceCents: 300,
    description: "Power tools for serious creators and sellers.",
    features: ["400 Scotty AI messages / day", "5 bots", "10 GB Scotty Cloud", "50 marketplace listings", "+15% coins on tasks", "Free bot-file generator", "Gold badge"],
    limits: { aiDaily: 400, bots: 5, cloudMb: 10240, listings: 50, taskBonusPct: 15, freeBotGeneration: true, prioritySupport: false, badge: "gold" } },
  { slug: "platinum", name: "Platinum", tier: "PLATINUM", priceCents: 400,
    description: "Full access to everything — no limits.",
    features: ["Unlimited Scotty AI", "Unlimited bots", "50 GB Scotty Cloud", "Unlimited listings", "+25% coins on tasks", "Free bot-file generator", "Priority support", "Platinum badge"],
    limits: { aiDaily: -1, bots: -1, cloudMb: 51200, listings: -1, taskBonusPct: 25, freeBotGeneration: true, prioritySupport: true, badge: "platinum" } },
];

export async function getEntitlements(userId: string): Promise<Entitlements> {
  const sub = await db.subscription.findFirst({
    where: { userId, status: "ACTIVE", OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: new Date() } }] },
    include: { plan: true },
    orderBy: { plan: { priceCents: "desc" } },
  });
  if (!sub) return FREE_ENTITLEMENTS;
  const catalog = PLAN_CATALOG.find((p) => p.slug === sub.plan.slug);
  const stored = (sub.plan.limits ?? {}) as Partial<Entitlements>;
  const base = catalog ? { tier: catalog.tier, ...catalog.limits } : { ...FREE_ENTITLEMENTS };
  return { ...base, ...stored, tier: catalog?.tier ?? "FREE" } as Entitlements;
}
