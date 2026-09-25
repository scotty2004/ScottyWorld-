"use client";

import { Page, SubHeader } from "@/components/ui";
import { Wrench } from "lucide-react";

export default function CreateBotPage() {
  return (
    <Page>
      <SubHeader title="Add my bot" backHref="/bots" />
      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15"><Wrench size={26} /></span>
        <p className="font-bold">Coming soon</p>
        <p className="max-w-xs text-sm text-subtle">Adding your own bot is coming soon. For now, pair a WhatsApp number straight onto Scotty_C from the Bots page — no file needed.</p>
      </div>
    </Page>
  );
}
