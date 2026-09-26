import { z } from "zod";

export const downloadRequestSchema = z.object({
  url: z.string().url().max(2048),
  format: z.string().min(1).max(30).default("auto"),
});

export function isPrivateOrLocalUrl(raw: string) {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      host.endsWith(".local")
    );
  } catch {
    return true;
  }
}
