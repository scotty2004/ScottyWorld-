import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  theme: z.enum(["system", "light", "dark"]).optional(),
  language: z.string().min(2).max(10).optional(),
  timezone: z.string().min(1).max(80).optional(),
  compactUI: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const preference = await db.userPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
    return NextResponse.json({ preference });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const preference = await db.userPreference.upsert({
      where: { userId: user.id },
      update: body,
      create: { userId: user.id, ...body },
    });
    return NextResponse.json({ preference });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid preferences" }, { status: 400 });
  }
}
