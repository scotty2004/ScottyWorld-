import {
  Home, Users, Sparkles, Boxes, Menu as MenuIcon, Bot, GraduationCap, Newspaper, Store, Radio, Coins,
  UserPlus, BarChart3, Cloud, ShieldCheck, Crown, LifeBuoy, HelpCircle, Settings, MessageCircle, Bell, UserRound, Search,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon; desc?: string };

/** The 5 bottom-bar tabs — exactly as in the design. */
export const TABS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Community", href: "/community", icon: Users },
  { label: "AI Assistant", href: "/ai", icon: Sparkles },
  { label: "Hub", href: "/developer", icon: Boxes },
  { label: "Menu", href: "/menu", icon: MenuIcon },
];

export const MENU_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  { title: "Social", items: [
    { label: "Messages", href: "/messages", icon: MessageCircle, desc: "Chat with people" },
    { label: "Notifications", href: "/notifications", icon: Bell, desc: "Likes, replies & updates" },
    { label: "Search", href: "/search", icon: Search, desc: "Find anything" },
    { label: "Channels", href: "/channels", icon: Radio, desc: "Join our channels" },
  ] },
  { title: "Build & Learn", items: [
    { label: "Bots", href: "/bots", icon: Bot, desc: "Host & generate bots" },
    { label: "Academy", href: "/academy", icon: GraduationCap, desc: "AI-made courses" },
    { label: "Tech News", href: "/news", icon: Newspaper, desc: "Latest from the admin" },
    { label: "Marketplace", href: "/marketplace", icon: Store, desc: "Buy & sell digital items" },
    { label: "Scotty Cloud", href: "/cloud", icon: Cloud, desc: "Your files, safe" },
  ] },
  { title: "Money", items: [
    { label: "Scotty Coins", href: "/coins", icon: Coins, desc: "Wallet & tasks" },
    { label: "Referrals", href: "/referrals", icon: UserPlus, desc: "Invite & earn" },
    { label: "Pro", href: "/pro", icon: Crown, desc: "Unlock more" },
    { label: "Analytics", href: "/analytics", icon: BarChart3, desc: "Top users & stats" },
  ] },
  { title: "Account", items: [
    { label: "Profile", href: "/profile", icon: UserRound },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Security Center", href: "/security", icon: ShieldCheck },
    { label: "Help & Support", href: "/support", icon: LifeBuoy },
    { label: "FAQ", href: "/faq", icon: HelpCircle },
  ] },
];

export const ALL_NAV: NavItem[] = MENU_GROUPS.flatMap((g) => g.items);
