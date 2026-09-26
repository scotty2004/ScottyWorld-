export type SearchResult = {
  title: string;
  description: string;
  href: string;
  category: string;
};

const pages: SearchResult[] = [
  { title: "Scotty AI", description: "Ask questions, debug code and get technical help.", href: "/ai", category: "AI" },
  { title: "Dashboard", description: "Your personalized ScottyWorld overview.", href: "/dashboard", category: "Platform" },
  { title: "Bots", description: "Build and manage supported automation bots.", href: "/bots", category: "Bots" },
  { title: "Developer Hub", description: "Developer utilities, code tools and APIs.", href: "/developer", category: "Developer" },
  { title: "Academy", description: "Courses, lessons, quizzes and learning progress.", href: "/academy", category: "Learning" },
  { title: "Tech News", description: "Technology and developer news.", href: "/news", category: "News" },
  { title: "Marketplace", description: "Apps, templates, bots, code and developer resources.", href: "/marketplace", category: "Marketplace" },
  { title: "Community", description: "Questions, projects and technical discussions.", href: "/community", category: "Community" },
  { title: "Security Center", description: "Account security and active sessions.", href: "/security", category: "Security" },
  { title: "Settings", description: "Manage your account preferences.", href: "/settings", category: "Account" },
];

export function searchScottyWorld(query: string, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return pages.slice(0, limit);

  return pages
    .map(item => {
      const haystack = `${item.title} ${item.description} ${item.category}`.toLowerCase();
      const words = q.split(/\s+/).filter(Boolean);
      const score = words.reduce((total, word) => total + (haystack.includes(word) ? 1 : 0), 0);
      return { item, score };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(result => result.item);
}
