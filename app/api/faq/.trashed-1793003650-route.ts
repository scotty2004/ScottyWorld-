import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_FAQ } from "@/lib/defaults";

export async function GET() {
  if ((await db.faqItem.count()) === 0) {
    await db.faqItem.createMany({ data: DEFAULT_FAQ.map((f, i) => ({ ...f, sortOrder: i })) });
  }
  const items = await db.faqItem.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ items });
}
