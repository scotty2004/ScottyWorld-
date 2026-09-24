import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { askScotty, streamScotty, attachmentToPart, type AiContentPart, type ChatAttachment } from "@/lib/integrations/ai";
import { SCOTTY_SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { enforceRateLimit } from "@/lib/security/request";
import { getEntitlements } from "@/lib/pro/plans";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ent = await getEntitlements(user.id);
  const day = new Date().toISOString().slice(0, 10);
  const usage = await db.aiUsage.findUnique({ where: { userId_day: { userId: user.id, day } } });
  return NextResponse.json({ configured: Boolean(process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY), limit: ent.aiDaily, used: usage?.count ?? 0, tier: ent.tier });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await enforceRateLimit(`ai:${user.id}`, 20, 60_000);

    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
    const rawAttachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 4) : [];
    if (!messages.length) return NextResponse.json({ error: "Messages required" }, { status: 400 });

    // Attachments must belong to the caller (upload keys are prefixed with the owner's user id).
    const attachments: ChatAttachment[] = rawAttachments
      .filter((a: any) => a && typeof a.key === "string" && a.key.startsWith(`${user.id}/`) && typeof a.name === "string" && Number.isFinite(a.size))
      .map((a: any) => ({ key: a.key, name: String(a.name).slice(0, 180), type: String(a.type || "application/octet-stream").slice(0, 100), size: Number(a.size) }));

    // daily quota by plan
    const ent = await getEntitlements(user.id);
    const day = new Date().toISOString().slice(0, 10);
    if (ent.aiDaily !== -1) {
      const usage = await db.aiUsage.findUnique({ where: { userId_day: { userId: user.id, day } } });
      if ((usage?.count ?? 0) >= ent.aiDaily) return NextResponse.json({ error: `You've used your ${ent.aiDaily} Scotty AI messages for today. Upgrade to Pro for more.`, code: "QUOTA" }, { status: 429 });
    }
    await db.aiUsage.upsert({ where: { userId_day: { userId: user.id, day } }, update: { count: { increment: 1 } }, create: { userId: user.id, day, count: 1 } });

    // client-supplied "system" messages are dropped — the persona/prompt is server-controlled
    const safe = messages
      .filter((m: any) => m?.role === "user" || m?.role === "assistant")
      .map((m: any) => ({ role: m.role as "user" | "assistant", content: String(m.content || "").slice(0, 12000) }));

    // Attach files/images to the last user message only, converting each to something the
    // model can actually consume (inlined image, inlined text snippet, or a plain description).
    if (attachments.length) {
      const lastUserIdx = [...safe].map((m) => m.role).lastIndexOf("user");
      if (lastUserIdx !== -1) {
        const parts: AiContentPart[] = [{ type: "text", text: safe[lastUserIdx].content || "(see attached file(s))" }];
        for (const att of attachments) parts.push(await attachmentToPart(att));
        (safe[lastUserIdx] as any).content = parts;
      }
    }

    const withPrompt = [{ role: "system" as const, content: `${SCOTTY_SYSTEM_PROMPT}\n\nThe user's display name is ${user.displayName}. When you write code the user might want to save, put each file in its own fenced code block using the form \`\`\`lang:filename.ext so the app can offer a real download.` }, ...safe];

    if (body.stream) {
      const stream = await streamScotty(withPrompt);
      return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
    }
    const answer = await askScotty(withPrompt);
    return NextResponse.json({ answer });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "RATE_LIMITED") return NextResponse.json({ error: "Slow down a little — too many messages." }, { status: 429 });
    if (msg === "AI_NOT_CONFIGURED") return NextResponse.json({ error: "Scotty AI isn't switched on yet. The admin needs to add the AI key.", code: "NOT_CONFIGURED" }, { status: 503 });
    return NextResponse.json({ error: "Scotty AI couldn't answer right now. Try again." }, { status: 502 });
  }
}
