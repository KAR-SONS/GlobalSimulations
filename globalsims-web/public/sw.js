// public/sw.js
// Simple service worker for GlobalSims PWA.
// Cache-first for static assets, always network for Supabase API calls.

const CACHE = 'globalsims-v1'

const STATIC_EXTENSIONS = ['.js', '.css', '.png', '.svg', '.ico', '.woff2']

self.addEventListener('install', (event) => {
  // Take over immediately — don't wait for old tabs to close
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept Supabase, Paystack, or any third-party API calls
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('paystack') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.protocol === 'chrome-extension:'
  ) {
    return
  }

  // For HTML navigation requests — network first, fall back to cached index.html
  // so the app still opens offline (user sees the login screen or their last state)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    )
    return
  }

  // For static assets — cache first, then network, then cache the result
  const isStatic = STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext))
  if (isStatic) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE).then((cache) => cache.put(request, clone))
            }
            return response
          })
      )
    )
    return
  }

  // Everything else — straight network, no caching
})
