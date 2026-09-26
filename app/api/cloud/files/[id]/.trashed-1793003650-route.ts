import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { removeObject } from "@/lib/integrations/storage";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  const file = await db.cloudFile.findFirst({ where: { id, userId: user.id } });
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 180) : undefined;
  const folder = typeof body.folder === "string" ? body.folder.trim().slice(0, 500) : undefined;
  const visibility = body.visibility === "PRIVATE" || body.visibility === "SHARED" ? body.visibility : undefined;

  const updated = await db.cloudFile.update({
    where: { id },
    data: { ...(name ? { name } : {}), ...(folder ? { folder } : {}), ...(visibility ? { visibility } : {}) },
  });

  return NextResponse.json({ file: updated });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  const file = await db.cloudFile.findFirst({ where: { id, userId: user.id } });
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });

  await db.cloudFile.delete({ where: { id } });
  // free the stored bytes too (bucket or database); never fail the request over it
  await removeObject(file.key).catch(() => null);
  return NextResponse.json({ deleted: true });
}
