import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { askScotty } from "@/lib/integrations/ai";
import { enforceRateLimit } from "@/lib/security/request";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await enforceRateLimit(`ai:${user.id}`, 20, 60_000);

    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
    if (!messages.length) return NextResponse.json({ error: "Messages required" }, { status: 400 });

    const safe = messages.map((m: any) => ({
      role: ["user", "assistant", "system"].includes(m?.role) ? m.role : "user",
      content: String(m?.content || "").slice(0, 12000),
    }));

    const answer = await askScotty(safe);
    return NextResponse.json({ answer });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "RATE_LIMITED") return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    if (msg === "AI_NOT_CONFIGURED") return NextResponse.json({ error: "Scotty AI is not configured yet" }, { status: 503 });
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
