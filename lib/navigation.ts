import {
  Bot, BrainCircuit, Code2, GraduationCap, Newspaper, Store,
  Users, Radio, Coins, UserRoundPlus, ChartNoAxesCombined,
  Cloud, ShieldCheck, Crown, LifeBuoy, Settings, Home, Search
} from "lucide-react";

export const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Scotty AI", href: "/ai", icon: BrainCircuit },
  { label: "Bots", href: "/bots", icon: Bot },
  { label: "Developer", href: "/developer", icon: Code2 },
  { label: "Academy", href: "/academy", icon: GraduationCap },
  { label: "Tech News", href: "/news", icon: Newspaper },
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Community", href: "/community", icon: Users },
  { label: "Channels", href: "/channels", icon: Radio },
  { label: "Scotty Coins", href: "/coins", icon: Coins },
  { label: "Referrals", href: "/referrals", icon: UserRoundPlus },
  { label: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
  { label: "Scotty Cloud", href: "/cloud", icon: Cloud },
  { label: "Security Center", href: "/security", icon: ShieldCheck },
  { label: "Pro", href: "/pro", icon: Crown },
  { label: "Support", href: "/support", icon: LifeBuoy },
  { label: "FAQ", href: "/faq", icon: Search },
  { label: "Settings", href: "/settings", icon: Settings }
];