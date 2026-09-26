import { z } from "zod";

export const quizSubmitSchema = z.object({
  quizId: z.string().min(1),
  answers: z.record(z.string(), z.number().int().min(0)),
});

export const lessonCompleteSchema = z.object({
  lessonId: z.string().min(1),
});
