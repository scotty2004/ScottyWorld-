import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createEmailVerification } from "@/lib/auth/verification";
import { parseDateOfBirth, registerSchema } from "@/lib/validators/auth";
import { sendEmail } from "@/lib/integrations/email";
import { ensureAccountNumber, ensureReferralCode } from "@/lib/coins/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      console.error("REGISTER_VALIDATION_FAILED", JSON.stringify(parsed.error.flatten()));
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid registration details." }, { status: 400 });
    }

    const { email, username, displayName, password, ref, dateOfBirth } = parsed.data;
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
        dateOfBirth: parseDateOfBirth(dateOfBirth),
        passwordHash,
        profile: { create: {} },
      },
      select: { id: true },
    });

    // wallet number + referral code, and attribute the referrer if a valid ?ref= code was used
    await ensureAccountNumber(user.id).catch(() => null);
    await ensureReferralCode(user.id, normalizedUsername).catch(() => null);
    if (ref) {
      const referrer = await db.user.findUnique({ where: { referralCode: ref.toLowerCase() }, select: { id: true } });
      if (referrer && referrer.id !== user.id) {
        await db.referral.create({ data: { referrerId: referrer.id, referredId: user.id, code: ref.toLowerCase() } }).catch(() => null);
      }
    }

    await createSession(user.id);

    // Verification email goes out in the background. SMTP can be slow or blocked
    // by the host (many platforms block ports 25/465/587), and it must never
    // keep the sign-up request hanging on "Creating account…".
    void (async () => {
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
        // exists and can be verified later.
        console.error("VERIFICATION_EMAIL_FAILED", (err as Error).message);
      }
    })();

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("REGISTER_FAILED", err);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
