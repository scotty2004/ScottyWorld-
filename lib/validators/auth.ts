import { z } from "zod";
import { passwordStrength } from "@/lib/auth/password-strength";

export const MIN_SIGNUP_AGE = 13;

/** "Name Surname" — at least two words, no digits or symbols. */
export function isFullName(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;
  if (!words.every((w) => w.length >= 2)) return false;
  return !/[\d_!@#$%^&*()+=\[\]{};:"\\|<>?\/~`]/.test(value);
}

/** Parses a yyyy-mm-dd date of birth. Returns null when it isn't a real date. */
export function parseDateOfBirth(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date;
}

export function ageFromDateOfBirth(dob: Date, now = new Date()) {
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday = now.getUTCMonth() < dob.getUTCMonth() || (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export const registerSchema = z.object({
  displayName: z.string().trim().min(3, "Enter your full name (name and surname).").max(60, "Name is too long.")
    .refine(isFullName, "Enter your full name (name and surname).")
    .transform((v) => v.replace(/\s+/g, " ")),
  username: z.string().min(3, "Username must be at least 3 characters.").max(30, "Username can be up to 30 characters.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only use letters, numbers and underscores."),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  password: z.string().min(8, "Use at least 8 characters.").max(128, "Password is too long."),
  confirmPassword: z.string().max(128),
  dateOfBirth: z.string().refine((v) => parseDateOfBirth(v) !== null, "Enter your date of birth.")
    .refine((v) => { const d = parseDateOfBirth(v); return !d || ageFromDateOfBirth(d) >= MIN_SIGNUP_AGE; }, `You must be at least ${MIN_SIGNUP_AGE} years old to join.`)
    .refine((v) => { const d = parseDateOfBirth(v); return !d || ageFromDateOfBirth(d) <= 120; }, "Enter a valid date of birth."),
  ref: z.string().trim().max(40).regex(/^[a-zA-Z0-9_-]*$/).optional(),
}).superRefine((v, ctx) => {
  const strength = passwordStrength(v.password, { username: v.username, email: v.email, name: v.displayName });
  if (!strength.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: strength.problem ?? "Choose a stronger password." });
  if (v.password !== v.confirmPassword) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "Passwords don't match." });
});

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
  code: z.string().trim().max(10).optional(),
});
