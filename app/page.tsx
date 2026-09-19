import Link from "next/link";
import { ArrowRight, BrainCircuit, Bot, Code2, GraduationCap, ShieldCheck, Store, Users } from "lucide-react";

const features = [
  ["Scotty AI", "Your intelligent guide for coding, technology, learning and navigating ScottyWorld.", BrainCircuit],
  ["Bot Platform", "Build, connect, manage and monitor supported bots from one workspace.", Bot],
  ["Developer Hub", "Practical coding utilities, playgrounds and AI-assisted developer tools.", Code2],
  ["Academy", "Learn Python, JavaScript, AI, web development, bots and more.", GraduationCap],
  ["Marketplace", "Discover digital products, templates, tools and developer resources.", Store],
  ["Community", "Share projects, ask questions and connect with technology builders.", Users],
];

export default function Home() {
  return (
    <div>
      <section className="grid-bg relative overflow-hidden border-b border-border">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-24 text-center sm:py-32">
          <div className="mx-auto mb-6 inline-flex rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted">
            One smart technology ecosystem
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-tight sm:text-7xl">
            SCOTTY<span className="text-brand-500">WORLD</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
            One smart platform for tech, AI, developers, bots, learning, community and digital tools.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 font-semibold text-white hover:bg-brand-600">
              Explore ScottyWorld <ArrowRight size={18} />
            </Link>
            <Link href="/ai" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 font-semibold hover:bg-background">
              Ask Scotty AI
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10">
          <p className="text-sm font-semibold text-brand-500">THE ECOSYSTEM</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Everything tech. One smart platform.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, description, Icon]) => {
            const I = Icon as typeof BrainCircuit;
            return (
              <div key={title as string} className="glass rounded-2xl p-6 transition hover:-translate-y-1 hover:shadow-glow">
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-brand-500">
                  <I size={21} />
                </div>
                <h3 className="text-lg font-semibold">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{description as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center">
          <ShieldCheck className="mx-auto text-brand-500" size={32} />
          <h2 className="mt-5 text-3xl font-bold">Built with security in mind</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">
            Authentication, authorization, privacy controls and server-side validation will be core parts of the platform rather than afterthoughts.
          </p>
        </div>
      </section>
    </div>
  );
}