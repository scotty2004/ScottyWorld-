import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { me, unauth, bad } from "@/lib/api";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { ensureAccountNumber } from "@/lib/coins/service";
import { isOwnerAccount } from "@/lib/admin/owner";

export async function GET() {
  const user = await me();
  if (!user) return unauth();
  const [pref, sub, accountNumber] = await Promise.all([
    db.userPreference.findUnique({ where: { userId: user.id } }),
    db.subscription.findFirst({ where: { userId: user.id, status: "ACTIVE" }, include: { plan: { select: { slug: true, name: true } } }, orderBy: { plan: { priceCents: "desc" } } }),
    ensureAccountNumber(user.id),
  ]);
  return NextResponse.json({
    account: {
      id: user.id, email: user.email, username: user.username, displayName: user.displayName, role: user.role, isOwner: isOwnerAccount(user),
      bio: user.profile?.bio ?? "", avatarUrl: user.profile?.avatarUrl ?? null, private: user.profile?.public === false,
      emailVerified: Boolean(user.emailVerified), twoFactor: user.twoFactorEnabled, hasPassword: Boolean(user.passwordHash),
      accountNumber, plan: sub?.plan?.slug ?? null, planName: sub?.plan?.name ?? null, createdAt: user.createdAt,
      preferences: { theme: pref?.theme ?? "system", readReceipts: pref?.readReceipts ?? true, showOnlineStatus: pref?.showOnlineStatus ?? true },
    },
  });
}

const patchSchema = z.object({
  displayName: z.string().trim().min(2).max(60).optional(),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  email: z.string().email().max(254).optional(),
  bio: z.string().trim().max(280).optional(),
  avatarUrl: z.string().max(300_000).refine((v) => v === "" || /^https?:\/\//.test(v) || /^data:image\/(png|jpeg|jpg|webp);base64,/.test(v)).optional(),
  private: z.boolean().optional(),
  currentPassword: z.string().max(128).optional(),
  newPassword: z.string().min(8).max(128).optional(),
  readReceipts: z.boolean().optional(),
  showOnlineStatus: z.boolean().optional(),
  theme: z.enum(["system", "light", "dark"]).optional(),
});

export async function PATCH(req: Request) {
  const user = await me();
  if (!user) return unauth();
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return bad("Please check the values you entered.");
  const d = parsed.data;

  // email / password changes need the current password (when the account has one)
  if ((d.email && d.email.toLowerCase() !== user.email) || d.newPassword) {
    if (user.passwordHash && !(await verifyPassword(d.currentPassword || "", user.passwordHash))) return bad("Current password is incorrect.", 401);
  }

  const userData: Record<string, unknown> = {};
  if (d.displayName) userData.displayName = d.displayName;
  if (d.username && d.username.toLowerCase() !== user.username) userData.username = d.username.toLowerCase();
  if (d.email && d.email.toLowerCase() !== user.email) { userData.email = d.email.toLowerCase(); userData.emailVerified = null; }
  if (d.newPassword) userData.passwordHash = await hashPassword(d.newPassword);

  try {
    if (Object.keys(userData).length) await db.user.update({ where: { id: user.id }, data: userData });
    if (d.bio !== undefined || d.avatarUrl !== undefined || d.private !== undefined) {
      await db.profile.upsert({
        where: { userId: user.id },
        update: { ...(d.bio !== undefined ? { bio: d.bio } : {}), ...(d.avatarUrl !== undefined ? { avatarUrl: d.avatarUrl || null } : {}), ...(d.private !== undefined ? { public: !d.private } : {}) },
        create: { userId: user.id, bio: d.bio, avatarUrl: d.avatarUrl || null, public: d.private === undefined ? true : !d.private },
      });
    }
    if (d.readReceipts !== undefined || d.showOnlineStatus !== undefined || d.theme !== undefined) {
      const data = { ...(d.readReceipts !== undefined ? { readReceipts: d.readReceipts } : {}), ...(d.showOnlineStatus !== undefined ? { showOnlineStatus: d.showOnlineStatus } : {}), ...(d.theme ? { theme: d.theme } : {}) };
      await db.userPreference.upsert({ where: { userId: user.id }, update: data, create: { userId: user.id, ...data } });
    }
  } catch (e: any) {
    if (e?.code === "P2002") return bad("That username or email is already taken.", 409);
    return bad("Could not save changes.", 500);
  }
  return NextResponse.json({ ok: true });
}
