import { z } from "zod";

export const productCreateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(80),
  description: z.string().trim().min(10).max(5000),
  type: z.enum(["TEMPLATE","APP","BOT","CODE","PLUGIN","THEME","TOOL","AI_TOOL","DEV_RESOURCE"]),
  priceCoins: z.number().int().min(0).max(1_000_000),
  priceCents: z.number().int().min(0).max(100_000_00).nullable().optional(),
  currency: z.string().trim().length(3).default("USD"),
  coverUrl: z.string().url().max(1000).nullable().optional(),
  downloadUrl: z.string().url().max(2000).nullable().optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(2000).optional(),
});
