import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { db } from "../../../../../lib/db";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  const session = await db.session.findFirst({ where: { id, userId: user.id } });
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  await db.session.delete({ where: { id } });
  return NextResponse.json({ revoked: true });
}
