"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    google?: any;
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";
let gsiPromise: Promise<void> | null = null;

/** Loads Google Identity Services once, however many times the button mounts. */
function loadGsi() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiPromise) {
    gsiPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => { gsiPromise = null; script.remove(); reject(new Error("Google script failed to load")); };
      document.head.appendChild(script);
    });
  }
  return gsiPromise;
}

// Google refuses sign-in inside embedded browsers (TikTok, Facebook, Instagram…), which is where many visitors arrive from.
const ERRORS: Record<string, string> = {
  rate: "Too many attempts. Wait a minute and try again.",
  csrf: "Google sign-in couldn't be verified. Refresh the page and try again.",
  config: "Google sign-in isn't set up on the server yet.",
  network: "The server couldn't reach Google. Please try again in a moment.",
  invalid: "Google couldn't verify your sign-in. Please try again.",
  failed: "Unable to sign in with Google. Please try again.",
};

const IN_APP = /(FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|musical_ly|BytedanceWebview|TikTok|Snapchat|; wv\))/i;

export function GoogleSignInButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [inApp, setInApp] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const urlError = ERRORS[useSearchParams().get("google_error") || ""] || "";

  useEffect(() => {
    let cancelled = false;
    setInApp(IN_APP.test(navigator.userAgent));
    fetch("/api/auth/google/config")
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setClientId(data.clientId || null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    loadGsi()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;
        // Redirect mode: the whole page goes to Google and Google sends the browser back to our callback.
        // No popup / postMessage, which is what left sign-in hanging on phones.
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: "redirect",
          login_uri: `${window.location.origin}/api/auth/google/callback`,
          auto_select: false,
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: Math.min(320, Math.max(220, window.innerWidth - 80)),
          shape: "pill",
        });
      })
      .catch(() => { if (!cancelled) setLoadError(true); });

    return () => { cancelled = true; };
  }, [clientId]);

  if (!clientId) return null;

  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-500">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="flex justify-center" ref={buttonRef} />
      {inApp && (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Google sign-in doesn&apos;t work inside in-app browsers (TikTok, Facebook, Instagram). Open this page in Chrome or Safari, or use your email above.
        </p>
      )}
      {loadError && (
        <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          Couldn&apos;t load Google sign-in. Check your connection and refresh the page.
        </p>
      )}
      {urlError && (
        <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {urlError}
        </p>
      )}
    </div>
  );
}
