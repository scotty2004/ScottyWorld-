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

/** "5d:12h:4m:2s" style countdown from a ms duration. Never negative. */
export function formatCountdown(msLeft: number) {
  const ms = Math.max(0, msLeft);
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}d:${h}h:${m}m:${sec}s`;
}

/** Ticks once a second; returns the live countdown string for a target Date/ISO string, or null once it's passed. */
export function useCountdown(target: string | Date | null | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const msLeft = new Date(target).getTime() - now;
  return { msLeft, expired: msLeft <= 0, text: formatCountdown(msLeft) };
}

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

/** PUTs a file with progress. Rejects with a readable message (uses the server's error text when it sends one). */
function putFile(url: string, file: File, type: string, onProgress?: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url);
    x.setRequestHeader("Content-Type", type);
    if (onProgress) x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    x.onload = () => {
      if (x.status >= 200 && x.status < 300) return resolve();
      let msg = "";
      try { msg = JSON.parse(x.responseText)?.error || ""; } catch { /* storage answered with XML/HTML */ }
      if (x.status === 401) window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      reject(new ApiError(msg || `Upload was rejected (${x.status}).`, x.status, null));
    };
    x.onerror = () => reject(new ApiError("Upload failed. Check your connection and try again.", 0, null));
    x.ontimeout = () => reject(new ApiError("Upload timed out. Try again on a better connection.", 0, null));
    x.send(file);
  });
}

/**
 * Uploads any file and returns where it lives.
 * Tries the direct-to-bucket URL first; if that fails for any reason (CORS, network, storage error)
 * it automatically retries through the app server, which also works when no bucket is connected.
 */
export async function uploadToStorage(file: File, opts: { purpose?: "cloud" | "media"; onProgress?: (pct: number) => void } = {}): Promise<{ key: string; url: string }> {
  const type = file.type || "application/octet-stream";
  const r = await api<{ mode: "direct" | "server"; uploadUrl: string; serverUploadUrl: string; key: string; publicUrl: string }>("/api/cloud/upload-url", {
    method: "POST",
    json: { filename: file.name, contentType: type, size: file.size, purpose: opts.purpose ?? "media" },
  });
  try {
    await putFile(r.uploadUrl, file, type, opts.onProgress);
  } catch (e) {
    if (r.mode !== "direct") throw e;
    opts.onProgress?.(0);
    await putFile(r.serverUploadUrl, file, type, opts.onProgress);
  }
  return { key: r.key, url: r.publicUrl };
}

/**
 * Uploads media for posts. Photos fall back to a compressed inline image if storage is unavailable;
 * videos always need storage (which now works with or without a connected bucket).
 */
export async function uploadMedia(file: File): Promise<{ url: string; type: "IMAGE" | "VIDEO" }> {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) throw new Error("Choose a photo or a video.");
  if (file.size > 100 * 1024 * 1024) throw new Error("Files can be up to 100 MB.");

  try {
    const up = await uploadToStorage(file, { purpose: "media" });
    return { url: up.url, type: isVideo ? "VIDEO" : "IMAGE" };
  } catch (e) {
    if (isVideo) throw e;
    return { url: await compressImage(file, 1280, 0.78), type: "IMAGE" };
  }
}

export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select();
    const ok = document.execCommand("copy"); t.remove(); return ok;
  }
}
