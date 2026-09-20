import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_CHANNELS } from "@/lib/defaults";

export async function GET() {
  if ((await db.channel.count()) === 0) {
    await db.channel.createMany({ data: DEFAULT_CHANNELS.map((c) => ({ name: c.name, platform: c.platform, url: c.url, description: c.description })) });
  }
  const channels = await db.channel.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ channels });
}
