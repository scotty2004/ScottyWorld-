"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleSignInButton() {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/google/config")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setClientId(data.clientId || null);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clientId || !buttonRef.current) return;

    async function handleCredential(response: { credential: string }) {
      setError("");
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Unable to sign in with Google.");
          return;
        }

        router.push("/dashboard");
        router.refresh();
      } catch {
        setError("Network problem. Check your connection and try again.");
      }
    }

    function render() {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: 320,
        shape: "pill",
      });
    }

    if (window.google) {
      render();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [clientId, router]);

  if (!clientId) return null;

  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-500">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="flex justify-center" ref={buttonRef} />
      {error && (
        <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
