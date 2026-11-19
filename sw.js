// カード引き落とし帳 service worker
const VERSION = "v1";
const SHELL = "shell-" + VERSION;
const FONTS = "fonts-" + VERSION;
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // 画面はネット優先（更新をすぐ反映）、つながらなければキャッシュ
  e.respondWith(fetch(req).then(r => {
    if (r.ok) caches.open(SHELL).then(c => c.put(req, r.clone()));
    return r;
  }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html"))));
});
