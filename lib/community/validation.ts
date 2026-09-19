import { z } from "zod";

export const postCreateSchema = z.object({
  type: z.enum(["POST", "QUESTION", "PROJECT"]),
  title: z.string().trim().max(160).optional(),
  content: z.string().trim().min(1).max(10_000),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
});

export const commentCreateSchema = z.object({
  content: z.string().trim().min(1).max(3_000),
});
