"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Video, X, Hash, HelpCircle, FolderGit2, Clock, Loader2 } from "lucide-react";
import { Avatar, Media } from "@/components/ui-media";
import { api, uploadMedia, useApi } from "@/lib/client";
import { toast } from "@/components/toast";

const KINDS = [{ id: "POST", label: "Post", icon: null }, { id: "QUESTION", label: "Question", icon: HelpCircle }, { id: "PROJECT", label: "Project", icon: FolderGit2 }, { id: "STORY", label: "Story", icon: Clock }] as const;

function Composer() {
  const router = useRouter();
  const sp = useSearchParams();
  const acc = useApi<{ account: { displayName: string; username: string; avatarUrl: string | null } }>("/api/account");
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>(sp.get("kind") === "story" ? "STORY" : "POST");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [media, setMedia] = useState<{ url: string; type: "IMAGE" | "VIDEO" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photo = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLInputElement>(null);

  async function pick(file?: File) {
    if (!file) return;
    setUploading(true);
    try { setMedia(await uploadMedia(file)); } catch (e) { toast((e as Error).message, "err"); } finally { setUploading(false); }
  }

  async function post() {
    setBusy(true);
    try {
      await api("/api/community/posts", { method: "POST", json: {
        type: kind === "STORY" ? "POST" : kind, isStory: kind === "STORY", title: kind === "QUESTION" || kind === "PROJECT" ? title || undefined : undefined,
        content: text, tags: tags.split(/[,\s]+/).map((t) => t.replace(/^#/, "").trim()).filter(Boolean).slice(0, 10),
        mediaUrl: media?.url ?? null, mediaType: media?.type ?? null,
      } });
      toast(kind === "STORY" ? "Story shared for 24 hours" : "Posted!");
      router.push("/community"); router.refresh();
    } catch (e) { toast((e as Error).message, "err"); setBusy(false); }
  }

  const can = (text.trim().length > 0 || media) && !busy && !uploading;
  const name = acc.data?.account.displayName ?? "You";

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur-xl">
        <button onClick={() => router.back()} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft"><X size={22} /></button>
        <h1 className="flex-1 text-center text-lg font-bold">Create {kind === "STORY" ? "Story" : "Post"}</h1>
        <button onClick={post} disabled={!can} className="rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-40">{busy ? "…" : "Post"}</button>
      </header>

      <div className="flex-1 px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={name} src={acc.data?.account.avatarUrl} size={44} />
          <div><p className="font-bold">{name}</p><span className="text-xs text-subtle">Visible to the community</span></div>
        </div>

        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
          {KINDS.map((k) => <button key={k.id} onClick={() => setKind(k.id)} className={`sw-chip ${kind === k.id ? "sw-chip-active" : ""}`}>{k.icon && <k.icon size={13} />}{k.label}</button>)}
        </div>

        {(kind === "QUESTION" || kind === "PROJECT") && <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder={kind === "QUESTION" ? "Your question in one line" : "Project name"} className="mt-4 w-full border-b border-border bg-transparent pb-3 text-lg font-bold outline-none placeholder:text-subtle" />}
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={10000} autoFocus placeholder={kind === "STORY" ? "Add a caption (optional)" : "What's on your mind?"} className="mt-3 min-h-[180px] w-full resize-none bg-transparent text-[17px] leading-relaxed outline-none placeholder:text-subtle" />

        {uploading && <p className="flex items-center gap-2 text-sm text-subtle"><Loader2 size={16} className="animate-spin" /> Uploading…</p>}
        {media && (
          <div className="relative mt-2">
            <Media url={media.url} type={media.type} className="max-h-80" />
            <button onClick={() => setMedia(null)} aria-label="Remove media" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white"><X size={16} /></button>
          </div>
        )}
        {kind !== "STORY" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border px-3 py-2.5"><Hash size={17} className="text-subtle" /><input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags: nodejs, ai, bots" className="w-full bg-transparent text-sm outline-none placeholder:text-subtle" /></div>
        )}
      </div>

      <div className="safe-bottom sticky bottom-0 flex items-center gap-2 border-t border-border bg-card px-4 py-3">
        <input ref={photo} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        <input ref={video} type="file" accept="video/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        <button onClick={() => photo.current?.click()} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-soft"><Camera size={20} /> Photo</button>
        <button onClick={() => video.current?.click()} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-soft"><Video size={20} /> Video</button>
        <span className="ml-auto text-xs text-subtle">{text.length}/10000</span>
      </div>
    </div>
  );
}

export default function CreatePostPage() { return <Suspense><Composer /></Suspense>; }
