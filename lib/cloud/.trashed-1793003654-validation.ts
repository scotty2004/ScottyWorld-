import { z } from "zod";

export const cloudFileSchema = z.object({
  name: z.string().trim().min(1).max(180),
  key: z.string().trim().min(1).max(500),
  mimeType: z.string().trim().max(150).optional(),
  sizeBytes: z.number().int().min(0).max(100 * 1024 * 1024),
  folder: z.string().trim().min(1).max(500).default("/"),
  visibility: z.enum(["PRIVATE", "SHARED"]).default("PRIVATE"),
  checksum: z.string().trim().max(200).optional(),
});
