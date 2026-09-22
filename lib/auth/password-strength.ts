/**
 * Password strength — pure functions shared by the register form (live meter) and the server (enforcement).
 */
export type PasswordContext = { username?: string; email?: string; name?: string };

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too weak" | "Weak" | "Fair" | "Good" | "Strong";
  checks: { length: boolean; lower: boolean; upper: boolean; number: boolean; symbol: boolean };
  /** meets the minimum rules for creating an account */
  ok: boolean;
  /** first thing to fix, ready to show to the user */
  problem: string | null;
};

const COMMON = new Set([
  "password", "password1", "password12", "password123", "passw0rd", "p@ssw0rd", "12345678", "123456789", "1234567890",
  "qwerty123", "qwertyui", "qwertyuiop", "1q2w3e4r", "iloveyou", "letmein123", "welcome1", "welcome123", "admin123",
  "abc12345", "abcd1234", "11111111", "00000000", "88888888", "monkey123", "football1", "superman1", "scottyworld", "scotty123",
]);

function isSequence(s: string) {
  if (s.length < 6) return false;
  let up = true; let down = true;
  for (let i = 1; i < s.length; i++) {
    const d = s.charCodeAt(i) - s.charCodeAt(i - 1);
    if (d !== 1) up = false;
    if (d !== -1) down = false;
  }
  return up || down;
}

export function passwordStrength(password: string, ctx: PasswordContext = {}): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const variety = [checks.lower, checks.upper, checks.number, checks.symbol].filter(Boolean).length;
  const lower = password.toLowerCase();

  const common = COMMON.has(lower) || /^(.)\1+$/.test(password) || isSequence(lower);
  const personal = [ctx.username, ctx.email?.split("@")[0]]
    .map((x) => (x ?? "").trim().toLowerCase())
    .some((x) => x.length >= 3 && lower.includes(x));

  let score = 0;
  if (checks.length) score += 1;
  if (password.length >= 12) score += 1;
  if (variety >= 3) score += 1;
  if (variety === 4 && password.length >= 10) score += 1;
  if (common) score = 0;
  else if (personal) score = Math.min(score, 1);
  score = Math.max(0, Math.min(4, score));

  let problem: string | null = null;
  if (!checks.length) problem = "Use at least 8 characters.";
  else if (!checks.upper || !checks.lower) problem = "Mix uppercase and lowercase letters.";
  else if (!checks.number) problem = "Add at least one number.";
  else if (common) problem = "That password is too common. Pick something harder to guess.";
  else if (personal) problem = "Your password shouldn't contain your username or email.";

  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"] as const;
  return { score: score as PasswordStrength["score"], label: labels[score], checks, ok: problem === null, problem };
}
