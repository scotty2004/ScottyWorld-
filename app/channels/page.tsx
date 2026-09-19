import Link from "next/link";

export default async function ChannelsPage() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const data = await fetch(`${base}/api/channels`, { cache: "no-store" }).then(r => r.json()).catch(() => ({ channels: [] }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-semibold">ScottyWorld Channels</h1>
      <p className="mt-1 text-muted-foreground">Official community channels and updates.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(data.channels || []).map((c: any) => (
          <Link key={c.id} href={c.url} target="_blank" rel="noreferrer" className="rounded-2xl border bg-card p-5 hover:bg-muted">
            <div className="font-medium">{c.name}</div>
            <div className="text-sm text-muted-foreground">{c.platform}</div>
            {c.description && <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>}
          </Link>
        ))}
        {!data.channels?.length && <div className="rounded-2xl border border-dashed p-8 text-muted-foreground">Official channels will appear here once configured by an administrator.</div>}
      </div>
    </main>
  );
}
