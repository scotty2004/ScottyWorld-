import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";

/** Delete a single message "for everyone" — only the sender can do this. Content is cleared, not the row (keeps reply threads intact). */
export async function DELETE(_: Request, ctx: { params: Promise<{ username: string; id: string }> }) {
  const user = await me();
  if (!user) return unauth();
  const { id } = await ctx.params;

  const message = await db.directMessage.findUnique({ where: { id }, select: { fromId: true, toId: true } });
  if (!message) return bad("Message not found.", 404);
  if (message.fromId !== user.id) return bad("You can only delete your own messages.", 403);

  await db.directMessage.update({ where: { id }, data: { content: "", deletedAt: new Date() } });
  return NextResponse.json({ deleted: true });
}
