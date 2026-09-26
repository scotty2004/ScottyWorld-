import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(2).max(80),
  description: z.string().max(500).optional(),
  visibility: z.enum(["PRIVATE", "SHARED"]).default("PRIVATE"),
});

export async function GET() {
  try {
    const user = await requireUser();
    const projects = await db.project.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" } });
    return NextResponse.json({ projects });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const data = createSchema.parse(await req.json());
    const project = await db.project.create({ data: { ...data, ownerId: user.id } });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create project" }, { status: 400 });
  }
}
