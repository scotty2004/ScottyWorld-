import { z } from "zod";

export const planCreateSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(80),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(5).max(1000),
  interval: z.enum(["MONTHLY", "YEARLY"]),
  priceCents: z.number().int().min(0).max(10_000_00),
  currency: z.string().trim().length(3).default("USD"),
  features: z.array(z.string().trim().min(1).max(200)).max(50),
  limits: z.record(z.string(), z.number().int().min(0)).optional(),
});
