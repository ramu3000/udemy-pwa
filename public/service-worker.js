importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.6.2/workbox-sw.js");

workbox.routing.registerRoute(/.*(?:firebasestorage\.googleapis)\.com.*$/, workbox.strategies.staleWhileRevalidate({
  cacheName: 'post-images'
}));

workbox.routing.registerRoute(/.*(?:googleapis|gstatic)\.com.*$/, workbox.strategies.staleWhileRevalidate({
  cacheName: 'google-fonts',
  plugins: [
    new workbox.expiration.Plugin({
      maxEntries: 3,
      maxAgeSeconds: 60 * 60 * 24 * 30
    }),
  ]
}));

workbox.routing.registerRoute('https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css', workbox.strategies.staleWhileRevalidate({
  cacheName: 'material-css'
}));

workbox.precaching.suppressWarnings();

workbox.precaching.precacheAndRoute([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "091637a4453219f0f1cc88e94a32ec25"
  },
  {
    "url": "manifest.json",
    "revision": "d11c7965f5cfba711c8e74afa6c703d7"
  },
  {
    "url": "offline.html",
    "revision": "98500f414abdebbe27d634d6a9e30159"
  },
  {
    "url": "src/css/app.css",
    "revision": "f27b4d5a6a99f7b6ed6d06f6583b73fa"
  },
  {
    "url": "src/css/feed.css",
    "revision": "79d8487c19b77f30bf039fe312cfadb2"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "a4140880117531fd301e62158a46c312"
  },
  {
    "url": "src/js/feed.js",
    "revision": "3617b29dfb0e991ed087bad55f1131ab"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "6b82fbb55ae19be4935964ae8c338e92"
  },
  {
    "url": "src/js/idb.js",
    "revision": "0be6f8e54197b220b920da9314bd85c9"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.js",
    "revision": "10c2238dcd105eb23f703ee53067417f"
  },
  {
    "url": "src/js/utility.js",
    "revision": "8b2f20be10626e2be82058b098959605"
  },
  {
    "url": "sw-base.js",
    "revision": "85f287f0f55bd9b50259f9ade9442825"
  },
  {
    "url": "sw.js",
    "revision": "baa10cd3a20ffdc6c73961c322531d22"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);
