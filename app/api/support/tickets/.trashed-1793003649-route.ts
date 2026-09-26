import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  subject: z.string().min(3).max(150),
  message: z.string().min(5).max(5000),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]).default("NORMAL"),
});

export async function GET() {
  try {
    const user = await requireUser();
    const tickets = await db.supportTicket.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ tickets });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const data = schema.parse(await req.json());
    const ticket = await db.supportTicket.create({ data: { userId: user.id, ...data } });
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create ticket" }, { status: 400 });
  }
}
