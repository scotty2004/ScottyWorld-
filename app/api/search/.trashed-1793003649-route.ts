import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { globalSearch } from "@/lib/search";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/security/request";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    await enforceRateLimit(`search:${user.id}`, 30, 60_000);

    const q = new URL(req.url).searchParams.get("q")?.trim() || "";
    if (q.length < 2) return NextResponse.json({ results: [] });

    const results = await globalSearch(q, user.id);
    // only searches the user actually submitted (?record=1) go into their history
    if (new URL(req.url).searchParams.get("record") === "1") await db.searchHistory.create({ data: { userId: user.id, query: q.slice(0, 200) } }).catch(() => {});
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 429 });
  }
}
