"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export class ApiError extends Error {
  status: number; data: any;
  constructor(message: string, status: number, data: any) { super(message); this.status = status; this.data = data; }
}

export async function api<T = any>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...(rest.headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && typeof window !== "undefined" && !url.startsWith("/api/auth")) {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
  if (!res.ok) throw new ApiError(data?.error || "Something went wrong.", res.status, data);
  return data as T;
}

/** Tiny data hook: { data, error, loading, reload, setData } */
export function useApi<T = any>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(Boolean(url));
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const load = useCallback(async (silent = false) => {
    if (!url) return;
    if (!silent) setLoading(true);
    try {
      const d = await api<T>(url);
      if (alive.current) { setData(d); setError(""); }
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => { void load(); }, [load]);
  return { data, error, loading, reload: () => load(true), setData };
}

export function timeAgo(input: string | Date) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(input).getTime()) / 1000));
  if (s < 45) return "now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d`;
  return new Date(input).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const compact = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 10_000 ? `${Math.round(n / 1000)}K` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));
export const bytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : n < 1073741824 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1073741824).toFixed(2)} GB`);

/** Shrinks an image in the browser and returns a JPEG data URL. */
export function compressImage(file: File, maxDim = 1280, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      const ctx = c.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); return reject(new Error("Image processing unavailable.")); }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That image couldn't be read.")); };
    img.src = url;
  });
}

export const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result));
  r.onerror = () => reject(new Error("Couldn't read the file."));
  r.readAsDataURL(file);
});

/**
 * Uploads media for posts. Uses object storage when it's connected (required for video);
 * otherwise falls back to a compressed inline image.
 */
export async function uploadMedia(file: File): Promise<{ url: string; type: "IMAGE" | "VIDEO" }> {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) throw new Error("Choose a photo or a video.");
  if (isVideo && file.size > 100 * 1024 * 1024) throw new Error("Videos can be up to 100 MB.");

  try {
    const r = await api<{ uploadUrl: string; publicUrl?: string }>("/api/cloud/upload-url", { method: "POST", json: { filename: file.name, contentType: file.type, size: file.size } });
    const put = await fetch(r.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (put.ok && r.publicUrl) return { url: r.publicUrl, type: isVideo ? "VIDEO" : "IMAGE" };
  } catch (e) {
    if (isVideo) throw new Error((e as ApiError).status === 503 ? "Video uploads need cloud storage — the admin hasn't connected it yet." : (e as Error).message);
  }
  if (isVideo) throw new Error("Video upload failed. Try again.");
  return { url: await compressImage(file, 1280, 0.78), type: "IMAGE" };
}

export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select();
    const ok = document.execCommand("copy"); t.remove(); return ok;
  }
}
