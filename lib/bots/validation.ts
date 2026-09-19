import { z } from "zod";

export const botCreateSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  provider: z.string().trim().min(2).max(40).default("custom"),
  commandPrefix: z.string().trim().min(1).max(5).default("."),
});

export const botUpdateSchema = botCreateSchema.partial().extend({
  version: z.string().trim().max(30).optional(),
});
