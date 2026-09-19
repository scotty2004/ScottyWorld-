import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth/verification";

export async function POST(request: Request) {
  const { token } = await request.json();
  if (typeof token !== "string") return NextResponse.json({ error: "Invalid token." }, { status: 400 });

  const verified = await verifyEmailToken(token);
  return NextResponse.json(
    verified ? { ok: true } : { error: "Invalid or expired token." },
    { status: verified ? 200 : 400 }
  );
}