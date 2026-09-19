import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const channels = await db.channel.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  return NextResponse.json({ channels });
}
