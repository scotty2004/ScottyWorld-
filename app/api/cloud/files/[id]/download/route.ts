import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";
import { createDownloadUrl } from "@/lib/integrations/storage";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  const { id } = await ctx.params;
  const file = await db.cloudFile.findFirst({ where: { id, userId: user.id } });
  if (!file) return bad("File not found.", 404);
  try {
    return NextResponse.json({ url: await createDownloadUrl(file.key, file.name) });
  } catch (e) {
    return bad((e as Error).message === "STORAGE_NOT_CONFIGURED" ? "Cloud storage isn't connected yet." : "Could not create download link.", 503);
  }
}
