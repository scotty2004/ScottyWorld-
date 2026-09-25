import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { askScotty } from "@/lib/integrations/ai";
import { SCOTTY_SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const limit = rateLimit(`developer-ai:${user.id}`, 20, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many AI requests." }, { status: 429 });

  try {
    const { code, language, action } = await request.json();

    if (typeof code !== "string" || code.length > 50_000) {
      return NextResponse.json({ error: "Code input is invalid or too large." }, { status: 400 });
    }

    const requestedAction = ["explain", "debug", "optimize", "document"].includes(action) ? action : "explain";

    const answer = await askScotty(
      [
        { role: "system", content: SCOTTY_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Developer action: ${requestedAction}\nLanguage: ${language || "unknown"}\n\nCode:\n${code}`,
        },
      ],
      { temperature: 0.2 },
    );

    return NextResponse.json({ answer });
  } catch (e) {
    if ((e as Error).message === "AI_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Scotty AI isn't switched on yet. The admin needs to add the AI key.", code: "NOT_CONFIGURED" }, { status: 503 });
    }
    return NextResponse.json({ error: "Developer AI is unavailable right now. Try again." }, { status: 503 });
  }
}
