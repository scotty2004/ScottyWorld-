import { z } from "zod";

const media = z.string().max(2_000_000).refine((v) => /^https?:\/\//.test(v) || /^\/api\/files\/[A-Za-z0-9_-]{8,64}\/[A-Za-z0-9._-]{1,260}$/.test(v) || /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(v), "Invalid media");

export const postCreateSchema = z.object({
  type: z.enum(["POST", "QUESTION", "PROJECT"]).default("POST"),
  title: z.string().trim().max(160).optional(),
  content: z.string().trim().max(10_000).default(""),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
  mediaUrl: media.nullable().optional(),
  mediaType: z.enum(["IMAGE", "VIDEO"]).nullable().optional(),
  isStory: z.boolean().optional(),
  sharedPostId: z.string().optional(),
}).refine((v) => v.content.length > 0 || v.mediaUrl || v.sharedPostId, { message: "Write something or attach media." });

export const commentCreateSchema = z.object({
  content: z.string().trim().min(1).max(3_000),
  parentId: z.string().optional(),
});
