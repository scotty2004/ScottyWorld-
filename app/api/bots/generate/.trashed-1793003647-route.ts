import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";
import { generateBot, BOT_FEATURES } from "@/lib/bots/generator";
import { getEntitlements } from "@/lib/pro/plans";
import { getCoinBalance } from "@/lib/coins/service";
import { ECONOMY } from "@/lib/economy";
import { freeTrialEnd } from "@/lib/bots/hosting";
import { rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2).max(40),
  prefix: z.string().trim().min(1).max(3).default("."),
  description: z.string().trim().max(300).optional(),
  idea: z.string().trim().max(500).optional(),
  features: z.array(z.string()).max(12).default(["menu", "ping"]),
});

/** Free for the first 4 days of an account (and for Gold/Platinum); otherwise costs coins. */
export async function GET() {
  const user = await me();
  if (!user) return unauth();
  const ent = await getEntitlements(user.id);
  const freeUntil = new Date(user.createdAt.getTime() + ECONOMY.BOT_GENERATOR_FREE_DAYS * 86_400_000);
  const free = ent.freeBotGeneration || freeUntil > new Date();
  return NextResponse.json({ free, freeUntil, cost: ECONOMY.BOT_GENERATOR_COST, features: BOT_FEATURES, aiEnabled: Boolean(process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY) });
}

export async function POST(req: Request) {
  const user = await me();
  if (!user) return unauth();
  if (!rateLimit(`bot-gen:${user.id}`, 6, 60_000).allowed) return bad("Too many requests.", 429);
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return bad("Give your bot a name (2–40 chars).");

  const ent = await getEntitlements(user.id);
  const owned = await db.bot.count({ where: { ownerId: user.id } });
  if (ent.bots !== -1 && owned >= ent.bots) return bad(`Your plan allows ${ent.bots} bot${ent.bots === 1 ? "" : "s"}. Upgrade to Pro for more.`, 403);

  const free = ent.freeBotGeneration || user.createdAt.getTime() + ECONOMY.BOT_GENERATOR_FREE_DAYS * 86_400_000 > Date.now();
  if (!free && (await getCoinBalance(user.id)) < ECONOMY.BOT_GENERATOR_COST)
    return bad(`The free generator window ended. Generating costs ${ECONOMY.BOT_GENERATOR_COST} SC — earn coins from tasks.`, 402);

  const file = await generateBot({ ...parsed.data, features: parsed.data.features });
  const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || `bot-${Date.now()}`;

  try {
    const bot = await db.$transaction(async (tx) => {
      if (!free) await tx.coinTransaction.create({ data: { userId: user.id, amount: -ECONOMY.BOT_GENERATOR_COST, type: "SPEND", reason: `Bot generator: ${parsed.data.name}` } });
      return tx.bot.create({
        data: {
          ownerId: user.id, name: parsed.data.name, slug, description: parsed.data.description || null, provider: "whatsapp",
          commandPrefix: parsed.data.prefix, source: "generated", generatedFile: file.content, generatedFileName: file.filename,
          hostedUntil: freeTrialEnd(), trialUsed: true,
        },
        select: { id: true, name: true, slug: true },
      });
    });
    return NextResponse.json({ bot, filename: file.filename, code: file.content }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return bad("You already have a bot with that name.", 409);
    return bad("Could not generate the bot.", 500);
  }
}
