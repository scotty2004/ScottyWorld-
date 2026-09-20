import { createHash } from "crypto";
import { db } from "@/lib/db";

export type Screening = { score: number; verdict: "LIKELY_VALID" | "UNCLEAR" | "SUSPICIOUS"; reasons: string[] };

export function hashImage(dataUrl: string) {
  return createHash("sha256").update(dataUrl).digest("hex");
}

/** Accepts only small PNG/JPEG/WEBP data URLs (client compresses first). */
export function validateScreenshot(dataUrl: unknown): string | null {
  if (typeof dataUrl !== "string") return "Screenshot is required.";
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) return "Upload a PNG, JPG or WEBP screenshot.";
  if (dataUrl.length > 1_600_000) return "Screenshot is too large (max ~1.2 MB).";
  return null;
}

/**
 * Anti-fraud screening. Deterministic checks run always; a vision model
 * (Scotty AI) is added when configured. The result is advisory — a human
 * admin still approves — except exact duplicates, which are auto-flagged.
 */
export async function screenSubmission(opts: {
  userId: string; taskTitle: string; platform: string; kind: string; dataUrl: string; hash: string;
}): Promise<Screening> {
  const reasons: string[] = [];
  let score = 70;

  const dup = await db.coinTaskSubmission.findFirst({ where: { imageHash: opts.hash, NOT: { userId: opts.userId } }, select: { id: true } });
  if (dup) { score -= 60; reasons.push("This exact screenshot was already submitted by another account."); }

  const user = await db.user.findUnique({ where: { id: opts.userId }, select: { createdAt: true } });
  if (user && Date.now() - user.createdAt.getTime() < 10 * 60_000) { score -= 15; reasons.push("Account is less than 10 minutes old."); }

  const recent = await db.coinTaskSubmission.count({ where: { userId: opts.userId, createdAt: { gt: new Date(Date.now() - 3600_000) } } });
  if (recent >= 6) { score -= 20; reasons.push("Unusually many submissions in the last hour."); }

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY;
  if (apiKey) {
    try {
      const endpoint = process.env.AI_API_URL || "https://openrouter.ai/api/v1/chat/completions";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: process.env.AI_VISION_MODEL || process.env.AI_MODEL || "openai/gpt-4o-mini",
          temperature: 0,
          messages: [
            { role: "system", content: "You verify proof-of-task screenshots for a rewards platform. Reply ONLY with JSON: {\"matches\":boolean,\"edited\":boolean,\"confidence\":0-100,\"reason\":string}. matches=true only if the screenshot clearly shows the requested action (followed / subscribed / joined / watched) on the requested platform. edited=true if it looks photoshopped, cropped to hide info, or is a stock image." },
            { role: "user", content: [
              { type: "text", text: `Task: ${opts.kind} on ${opts.platform} — "${opts.taskTitle}". Does the screenshot prove it?` },
              { type: "image_url", image_url: { url: opts.dataUrl } },
            ] },
          ],
        }),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const text = String(data?.choices?.[0]?.message?.content || "");
        const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
        if (json.matches) { score += Math.round((Number(json.confidence) || 50) / 5); } else { score -= 30; }
        if (json.edited) { score -= 40; reasons.push("AI: screenshot looks edited or fabricated."); }
        if (json.reason) reasons.push(`AI: ${String(json.reason).slice(0, 200)}`);
      }
    } catch { reasons.push("AI check unavailable — manual review needed."); }
  } else {
    reasons.push("AI check not configured — manual review needed.");
  }

  score = Math.max(0, Math.min(100, score));
  const verdict = score >= 75 ? "LIKELY_VALID" : score >= 45 ? "UNCLEAR" : "SUSPICIOUS";
  return { score, verdict, reasons };
}
