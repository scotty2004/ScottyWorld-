// ScottyWorld service worker — network-first, never touches the API or signed-in pages.
const CACHE = "scottyworld-shell-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add("/")));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // live data, streams and private pages always go straight to the network
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && url.pathname === "/") caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      })
      .catch(() => (url.pathname === "/" || req.mode === "navigate" ? caches.match("/") : Response.error()))
  );
});
