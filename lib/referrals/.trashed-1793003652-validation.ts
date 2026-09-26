import { z } from "zod";

export const referralCodeSchema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_-]+$/),
});
