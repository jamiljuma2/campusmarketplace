const CACHE_NAME = "campusmarket-v2";
const OFFLINE_URL = "/offline.html";
const HOME_URL = "/";
const HOME_CACHE_KEY = "/__offline_home__";
const PRECACHE_URLS = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png", "/campus-hero.png", "/campusmarket-logo.svg", "/campusmarket-logo-light.svg"];

async function cachePublicHome() {
  try {
    // Omit auth cookies so the stored document contains only public landing-page content.
    const response = await fetch(new Request(HOME_URL, {
      credentials: "omit",
      cache: "no-store",
      headers: { accept: "text/html" },
    }));
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return;
    const cache = await caches.open(CACHE_NAME);
    const html = await response.clone().text();
    const assets = [...new Set(html.match(/\/(?:_next\/static\/[^"'\s<>]+|_next\/image\?[^"'\s<>]+)/g) || [])].slice(0, 40);
    await Promise.all(assets.map(async (asset) => {
      try {
        const request = new Request(asset, { credentials: "omit" });
        if (await cache.match(request)) return;
        const assetResponse = await fetch(request);
        if (assetResponse.ok) await cache.put(request, assetResponse);
      } catch {
        // Some images may be unavailable; keep caching the rest of the landing page.
      }
    }));
    await cache.put(new Request(HOME_CACHE_KEY), response);
  } catch {
    // Keep the last saved landing page if refreshing it fails.
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("campusmarket-") && key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_PUBLIC_HOME") {
    event.waitUntil(cachePublicHome());
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || request.destination === "image") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) event.waitUntil(cache.put(request, response.clone()));
      return response;
    })());
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (url.pathname === HOME_URL && !url.search) event.waitUntil(cachePublicHome());
        return response;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(HOME_CACHE_KEY)) || (await cache.match(OFFLINE_URL)) || Response.error();
      }
    })());
  }
});
