import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { runDeveloperTool } from "../../../../lib/developer/operations";
import { validateToolInput } from "../../../../lib/developer/sanitize";
import { rateLimit } from "../../../../lib/security/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const limit = rateLimit(`developer:${user.id}`, 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many tool requests." }, { status: 429 });

  try {
    const body = await request.json();
    const tool = typeof body?.tool === "string" ? body.tool : "";
    const input = validateToolInput(body?.input ?? "");
    const pattern = typeof body?.pattern === "string" ? body.pattern : undefined;

    const output = runDeveloperTool(tool, input, pattern);
    return NextResponse.json({ output });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Developer operation failed." }, { status: 400 });
  }
}
