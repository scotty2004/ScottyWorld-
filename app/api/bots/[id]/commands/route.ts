import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { db } from "../../../../../lib/db";
import { getOwnedBot } from "../../../../../lib/bots/authorization";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().regex(/^[a-zA-Z0-9_-]+$/).max(40),
  description: z.string().trim().max(200).optional(),
  enabled: z.boolean().optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  const bot = await getOwnedBot(user.id, id);
  if (!bot) return NextResponse.json({ error: "Bot not found." }, { status: 404 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid command." }, { status: 400 });

  try {
    const command = await db.botCommand.create({
      data: {
        botId: id,
        name: parsed.data.name.toLowerCase(),
        description: parsed.data.description,
        enabled: parsed.data.enabled ?? true,
      },
    });
    return NextResponse.json({ command }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "That command already exists." }, { status: 409 });
    return NextResponse.json({ error: "Could not create command." }, { status: 500 });
  }
}
