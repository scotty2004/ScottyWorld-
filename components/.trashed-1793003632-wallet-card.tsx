"use client";

import { Copy, Wifi } from "lucide-react";
import { copyText } from "@/lib/client";
import { toast } from "./toast";
import { LogoMark } from "./logo";

/** Bank-card style wallet: balance + 6-digit account number. */
export function WalletCard({ balance, usd, accountNumber, holder }: { balance: number | null; usd: number | null; accountNumber: string | null; holder: string }) {
  const acct = accountNumber ? `${accountNumber.slice(0, 3)} ${accountNumber.slice(3)}` : "••• •••";
  return (
    <div className="wallet-card relative overflow-hidden rounded-3xl p-5 text-white shadow-float">
      <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
      <div className="absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2"><LogoMark size={30} /><span className="text-sm font-bold tracking-wide">Scotty Wallet</span></div>
        <Wifi size={22} className="rotate-90 text-white/80" />
      </div>
      <div className="relative mt-5 h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 opacity-90"><div className="absolute inset-x-0 top-1/2 h-px bg-amber-600/40" /><div className="absolute inset-y-0 left-1/2 w-px bg-amber-600/40" /></div>
      <div className="relative mt-4">
        <p className="text-[11px] font-medium uppercase tracking-widest text-white/70">Balance</p>
        <p className="text-4xl font-extrabold tabular-nums">{balance === null ? "—" : balance.toLocaleString()} <span className="text-lg font-bold text-white/80">SC</span></p>
        <p className="text-xs text-white/70">{usd === null ? "" : `≈ $${usd.toFixed(2)} USD`}</p>
      </div>
      <div className="relative mt-5 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/60">Account number</p>
          <button onClick={async () => { if (accountNumber) { await copyText(accountNumber); toast("Account number copied"); } }} className="flex items-center gap-2 font-mono text-2xl font-bold tracking-[.18em]">{acct}<Copy size={15} className="opacity-70" /></button>
          <p className="mt-1 max-w-[190px] truncate text-xs font-semibold uppercase tracking-wide text-white/85">{holder}</p>
        </div>
        <div className="relative h-9 w-14"><span className="absolute left-0 h-9 w-9 rounded-full bg-red-500/85" /><span className="absolute right-0 h-9 w-9 rounded-full bg-amber-400/85 mix-blend-screen" /></div>
      </div>
    </div>
  );
}
