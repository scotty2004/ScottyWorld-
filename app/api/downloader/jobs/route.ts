import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/security/request";
import { downloadRequestSchema, isPrivateOrLocalUrl } from "@/lib/downloader/validation";

export async function GET() {
  try {
    const user = await requireUser();
    const jobs = await db.downloadJob.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 25 });
    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await enforceRateLimit(`download:${user.id}`, 10, 60_000);

    const body = downloadRequestSchema.parse(await req.json());
    if (isPrivateOrLocalUrl(body.url)) return NextResponse.json({ error: "Private/local URLs are not allowed" }, { status: 400 });

    // This creates a job only. A real provider/worker must perform the permitted download.
    const job = await db.downloadJob.create({
      data: { userId: user.id, sourceUrl: body.url, format: body.format, status: "PENDING" },
    });

    return NextResponse.json({
      job,
      message: "Job created. Configure a permitted media provider/worker to process it.",
    }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid download request" }, { status: 400 });
  }
}
