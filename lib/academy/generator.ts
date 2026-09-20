import { askScotty } from "@/lib/integrations/ai";

export type GeneratedCourse = {
  title: string; description: string; category: string;
  lessons: Array<{ title: string; content: string; durationMin: number; quiz: Array<{ question: string; options: string[]; answer: number }> }>;
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "course";
export { slugify };

/** Asks Scotty AI for a compact, beginner-friendly course as strict JSON. */
export async function generateCourse(topic: string, level: string, lessonCount: number): Promise<GeneratedCourse> {
  const raw = await askScotty(
    [
      { role: "system", content: "You are Scotty AI, a course author for ScottyWorld Academy. Output ONLY valid JSON, no markdown fences. Courses must be simple, practical and straight to the point for phone readers: short lessons (150-300 words), plain language, small code examples in markdown fenced blocks only where needed." },
      { role: "user", content: `Create a ${level.toLowerCase()} course on "${topic}" with exactly ${lessonCount} lessons in a logical order (each builds on the last). JSON shape: {"title":string,"description":string (max 160 chars),"category":one of ["Programming","AI & Machine Learning","Cloud Computing","Cybersecurity","Data Science","DevOps","Web Development","Bots & Automation"],"lessons":[{"title":string,"content":string (markdown),"durationMin":number,"quiz":[{"question":string,"options":[4 strings],"answer":0-3 index of the correct option}] (exactly 3 questions)}]}` },
    ],
    { temperature: 0.4 },
  );
  const json = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
  if (!json?.title || !Array.isArray(json.lessons) || json.lessons.length === 0) throw new Error("BAD_AI_OUTPUT");
  const lessons = json.lessons.slice(0, 12).map((l: any) => ({
    title: String(l.title).slice(0, 120),
    content: String(l.content).slice(0, 8000),
    durationMin: Math.min(30, Math.max(3, Number(l.durationMin) || 8)),
    quiz: (Array.isArray(l.quiz) ? l.quiz : [])
      .filter((q: any) => q?.question && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length)
      .slice(0, 5)
      .map((q: any) => ({ question: String(q.question).slice(0, 300), options: q.options.map((o: any) => String(o).slice(0, 200)), answer: q.answer })),
  }));
  return { title: String(json.title).slice(0, 120), description: String(json.description || "").slice(0, 200), category: String(json.category || "Programming").slice(0, 40), lessons };
}
