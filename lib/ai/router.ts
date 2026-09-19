export type ScottyIntent =
  | "chat"
  | "navigation"
  | "search"
  | "coding"
  | "unknown";

const routes: Array<[RegExp, ScottyIntent]> = [
  [/^(go to|open|take me to|navigate to)\b/i, "navigation"],
  [/\b(search|find|look for)\b/i, "search"],
  [/\b(code|coding|debug|bug|javascript|typescript|python|node|sql|html|css|api)\b/i, "coding"],
];

export function detectIntent(input: string): ScottyIntent {
  for (const [pattern, intent] of routes) {
    if (pattern.test(input)) return intent;
  }
  return "chat";
}

const destinations: Record<string, string> = {
  dashboard: "/dashboard",
  home: "/",
  ai: "/ai",
  bots: "/bots",
  developer: "/developer",
  academy: "/academy",
  news: "/news",
  marketplace: "/marketplace",
  community: "/community",
  security: "/security",
  settings: "/settings",
};

export function resolveNavigation(input: string) {
  const normalized = input.toLowerCase();
  for (const [name, path] of Object.entries(destinations)) {
    if (normalized.includes(name)) return { name, path };
  }
  return null;
}
