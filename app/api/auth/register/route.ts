import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createEmailVerification } from "@/lib/auth/verification";
import { registerSchema } from "@/lib/validators/auth";
import { sendEmail } from "@/lib/integrations/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      console.error("REGISTER_VALIDATION_FAILED", JSON.stringify(parsed.error.flatten()));
      return NextResponse.json({ error: "Invalid registration details." }, { status: 400 });
    }

    const { email, username, displayName, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();

    const existing = await db.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: normalizedUsername },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with those details already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        displayName,
        passwordHash,
        profile: { create: {} },
      },
      select: { id: true },
    });

    await createSession(user.id);

    try {
      const token = await createEmailVerification(user.id);
      const base = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
      const link = `${base.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
      await sendEmail({
        to: normalizedEmail,
        subject: "Verify your ScottyWorld email",
        text: `Welcome to ScottyWorld. Verify your email address (link expires in 24 hours):\n\n${link}`,
        html: `<p>Welcome to ScottyWorld. Verify your email address (link expires in 24 hours).</p><p><a href="${link}">Verify email</a></p>`,
      });
    } catch (err) {
      // Email provider not configured or delivery failed. The account still
      // exists and can be verified later; don't fail registration on this.
      console.error("VERIFICATION_EMAIL_FAILED", (err as Error).message);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("REGISTER_FAILED", err);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
