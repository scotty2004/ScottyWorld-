"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bookmark, Flag, Heart, MessageCircle, Plus, Send, Users } from "lucide-react";

type Post = {
  id: string; type: string; title: string | null; content: string; createdAt: string;
  author: { username: string; displayName: string; profile: { avatarUrl: string | null; public: boolean } | null };
  _count: { comments: number; likes: number };
};

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("POST");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  async function load() {
    const response = await fetch("/api/community/posts");
    const data = await response.json();
    setPosts(data.posts || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPosting(true);
    const response = await fetch("/api/community/posts", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ type, title, content }),
    });
    if (response.ok) { setContent(""); setTitle(""); await load(); }
    setPosting(false);
  }

  async function like(id: string) {
    await fetch(`/api/community/posts/${id}/like`, {method:"POST"});
    load();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500"><Users /></div>
        <div><h1 className="text-3xl font-bold">Community</h1><p className="mt-1 text-sm text-muted">Share projects, ask questions and learn with other builders.</p></div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <main className="space-y-4">
          {loading ? <p className="text-sm text-muted">Loading community...</p> : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-sm text-muted">No posts yet. Start the first discussion.</div>
          ) : posts.map(post => (
            <article key={post.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-sm font-semibold">{post.author.displayName}</p><p className="text-xs text-muted">@{post.author.username} · {post.type}</p></div>
                <button className="text-muted" title="Report"><Flag size={16}/></button>
              </div>
              {post.title && <h2 className="mt-4 text-lg font-semibold">{post.title}</h2>}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">{post.content}</p>
              <div className="mt-5 flex items-center gap-4 text-sm text-muted">
                <button onClick={() => like(post.id)} className="inline-flex items-center gap-1.5 hover:text-brand-500"><Heart size={16}/> {post._count.likes}</button>
                <span className="inline-flex items-center gap-1.5"><MessageCircle size={16}/> {post._count.comments}</span>
                <button className="inline-flex items-center gap-1.5 hover:text-brand-500"><Bookmark size={16}/> Save</button>
              </div>
            </article>
          ))}
        </main>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2"><Plus size={18} className="text-brand-500"/><h2 className="font-semibold">Create post</h2></div>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <select value={type} onChange={e=>setType(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
              <option value="POST">Post</option><option value="QUESTION">Question</option><option value="PROJECT">Project</option>
            </select>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title (optional)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"/>
            <textarea required value={content} onChange={e=>setContent(e.target.value)} rows={7} placeholder="Share something useful..." className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm"/>
            <button disabled={posting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Send size={16}/> {posting ? "Publishing..." : "Publish"}</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
