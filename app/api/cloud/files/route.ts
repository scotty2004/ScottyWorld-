import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cloudFileSchema } from "@/lib/cloud/validation";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const url = new URL(request.url);
  const folder = url.searchParams.get("folder") || "/";
  const files = await db.cloudFile.findMany({
    where: { userId: user.id, folder },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ files });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = cloudFileSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid file metadata.", issues: parsed.error.flatten() }, { status: 400 });

  const existing = await db.cloudFile.findUnique({
    where: { userId_key: { userId: user.id, key: parsed.data.key } },
  });
  if (existing) return NextResponse.json({ error: "A file with that key already exists." }, { status: 409 });

  const file = await db.cloudFile.create({
    data: {
      userId: user.id,
      ...parsed.data,
      mimeType: parsed.data.mimeType || null,
      checksum: parsed.data.checksum || null,
    },
  });

  return NextResponse.json({ file }, { status: 201 });
}
