import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["SECURITY", "SYSTEM", "COMMUNITY", "BOT", "MARKETPLACE", "ACADEMY", "REFERRAL", "PRO"]),
  channel: z.enum(["IN_APP", "EMAIL", "PUSH"]),
  enabled: z.boolean(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const preferences = await db.notificationPreference.findMany({ where: { userId: user.id } });
    return NextResponse.json({ preferences });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const preference = await db.notificationPreference.upsert({
      where: { userId_type_channel: { userId: user.id, type: body.type, channel: body.channel } },
      update: { enabled: body.enabled },
      create: { userId: user.id, ...body },
    });
    return NextResponse.json({ preference });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid notification preference" }, { status: 400 });
  }
}
