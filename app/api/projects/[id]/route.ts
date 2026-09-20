import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  const { id } = await ctx.params;
  const r = await db.project.deleteMany({ where: { id, ownerId: user.id } });
  return r.count ? NextResponse.json({ deleted: true }) : bad("Project not found.", 404);
}
