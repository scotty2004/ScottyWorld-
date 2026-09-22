import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";
import { createDownloadUrl, s3Configured } from "@/lib/integrations/storage";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  const { id } = await ctx.params;
  const file = await db.cloudFile.findFirst({ where: { id, userId: user.id } });
  if (!file) return bad("File not found.", 404);

  // Direct link from the bucket when connected; otherwise (or if presigning fails) stream through the app.
  const viaApp = `/api/files/${file.key}?download=1`;
  if (!s3Configured()) return NextResponse.json({ url: viaApp });
  try {
    return NextResponse.json({ url: await createDownloadUrl(file.key, file.name) });
  } catch {
    return NextResponse.json({ url: viaApp });
  }
}
