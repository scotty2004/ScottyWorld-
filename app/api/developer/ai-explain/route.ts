import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { aiProvider } from "../../../../lib/ai/provider";
import { SCOTTY_SYSTEM_PROMPT } from "../../../../lib/ai/prompt";
import { rateLimit } from "../../../../lib/security/rate-limit";

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

    const answer = await aiProvider.chat({
      temperature: 0.2,
      messages: [
        { role: "system", content: SCOTTY_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Developer action: ${requestedAction}\nLanguage: ${language || "unknown"}\n\nCode:\n${code}`,
        },
      ],
    });

    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json({ error: "Developer AI is unavailable or not configured." }, { status: 503 });
  }
}
