import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().max(254),
  username: z.string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(2).max(60),
  password: z.string().min(8).max(128),
  ref: z.string().trim().max(40).regex(/^[a-zA-Z0-9_-]*$/).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
  code: z.string().trim().max(10).optional(),
});
