import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot, Brain, Cloud, Code2, Coins, GraduationCap, LayoutGrid, Newspaper, Search, ShoppingBag, Users, ArrowRight, Check, Rocket, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

const TILES = [
  { icon: Brain, title: "AI Assistant", text: "Ask, learn, create, build with Scotty AI", color: "from-sky-500/25 to-blue-600/10 text-sky-300" },
  { icon: Bot, title: "Bot Platform", text: "Create, manage and host your bots", color: "from-indigo-500/25 to-blue-600/10 text-indigo-300" },
  { icon: Code2, title: "Developer Hub", text: "Code, test, build and deploy", color: "from-blue-500/25 to-cyan-600/10 text-blue-300" },
  { icon: GraduationCap, title: "Academy", text: "Learn new skills with AI-made courses", color: "from-emerald-500/25 to-teal-600/10 text-emerald-300" },
  { icon: ShoppingBag, title: "Marketplace", text: "Buy and sell digital products & tools", color: "from-violet-500/25 to-purple-600/10 text-violet-300" },
  { icon: Users, title: "Community", text: "Connect, share, grow together", color: "from-cyan-500/25 to-sky-600/10 text-cyan-300" },
  { icon: Newspaper, title: "Tech News", text: "Latest tech, AI and industry updates", color: "from-blue-500/25 to-indigo-600/10 text-blue-300" },
  { icon: Coins, title: "Scotty Coins", text: "Earn, spend and get rewards", color: "from-amber-500/25 to-orange-600/10 text-amber-300" },
  { icon: Cloud, title: "Scotty Cloud", text: "Store, manage and access your files", color: "from-teal-500/25 to-emerald-600/10 text-teal-300" },
  { icon: LayoutGrid, title: "More Tools", text: "Referrals, analytics, Pro and more", color: "from-fuchsia-500/25 to-violet-600/10 text-fuchsia-300" },
];

function Mascot() {
  return (
    <svg viewBox="0 0 320 340" className="h-full w-full drop-shadow-[0_0_40px_rgba(59,130,246,.55)]" aria-hidden="true">
      <defs>
        <radialGradient id="glow" cx=".5" cy=".45" r=".6"><stop offset="0" stopColor="#3b82f6" stopOpacity=".55" /><stop offset="1" stopColor="#3b82f6" stopOpacity="0" /></radialGradient>
        <linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e8efff" /><stop offset="1" stopColor="#9db8ff" /></linearGradient>
        <linearGradient id="hood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2447d6" /><stop offset="1" stopColor="#101e63" /></linearGradient>
      </defs>
      <circle cx="160" cy="170" r="150" fill="url(#glow)" />
      <ellipse cx="160" cy="318" rx="92" ry="12" fill="#3b82f6" opacity=".25" />
      <path d="M62 300c4-58 40-92 98-92s94 34 98 92z" fill="url(#hood)" />
      <path d="M128 214c10 14 54 14 64 0l6 30c-20 12-56 12-76 0z" fill="#0b1650" />
      <text x="150" y="286" fontSize="34" fontWeight="800" fill="#7fa4ff" fontFamily="Inter,system-ui">S</text>
      <rect x="66" y="52" width="188" height="150" rx="66" fill="url(#body)" />
      <rect x="86" y="84" width="148" height="88" rx="40" fill="#0a1233" />
      <path d="M118 128q14-18 28 0" stroke="#60a5fa" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M174 128q14-18 28 0" stroke="#60a5fa" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M142 150q18 16 36 0" stroke="#60a5fa" strokeWidth="7" strokeLinecap="round" fill="none" />
      <rect x="150" y="30" width="20" height="26" rx="10" fill="#9db8ff" /><circle cx="160" cy="26" r="9" fill="#60a5fa" />
      <rect x="46" y="100" width="20" height="50" rx="10" fill="#9db8ff" /><rect x="254" y="100" width="20" height="50" rx="10" fill="#9db8ff" />
      <path d="M262 232c18-4 30-22 32-44" stroke="#c7d6ff" strokeWidth="14" strokeLinecap="round" fill="none" />
    </svg>
  );
}

async function stats() {
  try {
    const [users, bots, courses, products, posts] = await Promise.all([
      db.user.count(), db.bot.count(), db.course.count({ where: { status: "PUBLISHED" } }), db.marketplaceProduct.count({ where: { status: "PUBLISHED" } }), db.post.count({ where: { isStory: false } }),
    ]);
    return [
      { v: users, l: "Members" }, { v: bots, l: "Bots hosted" }, { v: courses, l: "AI courses" }, { v: products, l: "Marketplace items" }, { v: posts, l: "Community posts" },
    ];
  } catch { return []; }
}

export default async function Landing() {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/dashboard");
  const numbers = await stats();

  return (
    <div className="hero-glow min-h-dvh text-white">
      <div className="mesh-line">
        {/* nav */}
        <header className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
          <Logo light href="/" />
          <nav className="ml-8 hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#top" className="font-semibold text-white">Home</a><a href="#features" className="hover:text-white">Features</a><a href="#explore" className="hover:text-white">Explore</a><a href="#why" className="hover:text-white">Why us</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="rounded-xl border border-blue-400/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Login</Link>
            <Link href="/register" className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold shadow-glow">Get Started</Link>
          </div>
        </header>

        {/* hero */}
        <section id="top" className="mx-auto grid max-w-6xl items-center gap-4 px-5 pb-6 pt-8 md:grid-cols-2 md:pt-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-200"><Rocket size={13} /> The All-in-One Tech Ecosystem</span>
            <h1 className="mt-5 text-[44px] font-black leading-none tracking-tight sm:text-6xl">SCOTTY<span className="text-blue-500">WORLD</span></h1>
            <p className="mt-5 max-w-md text-lg text-slate-200">One smart platform for tech, AI, developers, bots, learning, community and digital tools.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 px-5 py-3 text-sm font-bold shadow-glow">Explore ScottyWorld <ArrowRight size={16} /></Link>
              <Link href="/login?next=/ai" className="inline-flex items-center gap-2 rounded-xl border border-blue-400/40 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"><Brain size={16} /> Ask Scotty AI</Link>
            </div>
          </div>
          <div className="relative mx-auto h-72 w-72 md:h-96 md:w-96">
            <div className="absolute -top-2 right-0 z-10 max-w-[190px] rounded-2xl border border-blue-400/40 bg-slate-900/80 p-3 text-xs backdrop-blur">
              <p className="font-bold text-blue-300">Hi! I&apos;m Scotty</p><p className="mt-0.5 text-slate-300">Your AI assistant, always here to help you build, learn and grow.</p>
            </div>
            <Mascot />
          </div>
        </section>

        {/* search */}
        <section className="mx-auto max-w-4xl px-5">
          <Link href="/login?next=/search" className="flex items-center gap-3 rounded-2xl border border-blue-400/25 bg-slate-900/60 px-5 py-4 text-slate-300 backdrop-blur">
            <Search size={19} /><span className="flex-1 text-sm">Ask Scotty or search ScottyWorld…</span><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600"><ArrowRight size={17} /></span>
          </Link>
          <div className="no-scrollbar mt-4 flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400">
            <span className="shrink-0">Popular:</span>
            {["Create a bot", "JavaScript tools", "Learn Python", "Latest AI news", "Open marketplace"].map((c) => <span key={c} className="shrink-0 rounded-lg border border-blue-400/20 bg-slate-900/60 px-3 py-1.5 text-slate-200">{c}</span>)}
          </div>
        </section>

        {/* tiles */}
        <section id="features" className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-5 py-10 md:grid-cols-5">
          {TILES.map((t) => {
            const I = t.icon;
            return (
              <div key={t.title} className="rounded-2xl border border-blue-400/15 bg-slate-900/50 p-4 text-center backdrop-blur">
                <div className={`mx-auto grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${t.color}`}><I size={24} /></div>
                <p className="mt-3 text-sm font-bold">{t.title}</p><p className="mt-1 text-[11px] leading-snug text-slate-400">{t.text}</p>
              </div>
            );
          })}
        </section>

        {/* why */}
        <section id="why" className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-200"><ShieldCheck size={13} /> Why ScottyWorld?</span>
            <h2 className="mt-4 text-4xl font-extrabold leading-tight">Everything You Need <br />in <span className="text-blue-500">One Place</span></h2>
            <p className="mt-4 max-w-md text-sm text-slate-300">ScottyWorld combines the best technology, AI, learning and community tools into a single powerful platform. Save time, boost productivity and achieve more.</p>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-200">
              {["Modern & intuitive interface", "Secure and reliable", "Works on all your devices", "Always evolving"].map((x) => <li key={x} className="flex items-center gap-2.5"><span className="grid h-5 w-5 place-items-center rounded-md bg-blue-600"><Check size={13} /></span>{x}</li>)}
            </ul>
            <Link href="/register" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 px-5 py-3 text-sm font-bold shadow-glow">Create your free account <ArrowRight size={16} /></Link>
          </div>
          <div className="rounded-3xl border border-blue-400/20 bg-slate-900/60 p-4 backdrop-blur">
            <div className="rounded-2xl bg-slate-950/70 p-4">
              <div className="flex items-center gap-2"><Brain size={18} className="text-blue-400" /><p className="text-sm font-bold">Hello! I&apos;m Scotty AI</p></div>
              <p className="mt-1 text-xs text-slate-400">How can I help you today?</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                {[["Create a Bot", Bot], ["Learn Python", GraduationCap], ["Open Marketplace", ShoppingBag]].map(([l, I]: any) => <div key={l} className="rounded-xl border border-blue-400/15 bg-slate-900 p-3"><I size={18} className="mx-auto text-blue-400" /><p className="mt-1.5">{l}</p></div>)}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs"><span className="flex items-center gap-2"><Coins size={16} className="text-amber-300" /> Scotty Coins</span><span className="font-bold text-amber-200">20 SC = $0.50</span></div>
            </div>
          </div>
        </section>

        {/* stats — live numbers from the database */}
        {numbers.length > 0 && (
          <section id="explore" className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-5 py-8 sm:grid-cols-5">
            {numbers.map((n) => <div key={n.l} className="text-center"><p className="text-2xl font-extrabold">{n.v.toLocaleString()}</p><p className="text-xs text-slate-400">{n.l}</p></div>)}
          </section>
        )}
      </div>

      <footer className="border-t border-blue-400/15 bg-gradient-to-b from-indigo-900/40 to-slate-950 px-5 py-10 text-center">
        <p className="text-lg font-bold">Everything tech. One smart platform.</p>
        <div className="mt-3 flex justify-center"><Logo light href="/" /></div>
        <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
          {["AI", "Bots", "Developers", "Learning", "Community", "Tools"].map((x) => <span key={x}>{x}</span>)}
        </div>
        <p className="mt-6 text-[11px] text-slate-500">© {new Date().getFullYear()} ScottyWorld</p>
      </footer>
    </div>
  );
}
