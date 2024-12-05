import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// מיד מבטל המתנה ל-Service Worker חדש
self.skipWaiting();
self.clientsClaim();

// 1. Precache קבצים חשובים (מתווספים אוטומטית על ידי Workbox)
// `self.__WB_MANIFEST` יוחלף אוטומטית ברשימת הקבצים שלך.
precacheAndRoute(self.__WB_MANIFEST || []);

// 2. מנקה קבצים ישנים בקאש
cleanupOutdatedCaches();

// 3. Caching של עמוד הבית ודפים חשובים (Network First)
registerRoute(
  "/",
  new NetworkFirst({
    cacheName: "start-url",
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 24 * 60 * 60, // יום אחד
        maxEntries: 10,
      }),
    ],
  }),
  "GET"
);

// 4. Caching של API (Network First עם Timeout)
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 10, // נסה מהרשת, חכה 10 שניות
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50, // עד 50 בקשות API
        maxAgeSeconds: 60 * 60, // שעה אחת
      }),
    ],
  }),
  "GET"
);

// 5. סטטיים כמו גופנים, CSS, תמונות (Cache First)
registerRoute(
  /\.(?:css|js|woff2|woff|ttf|eot|svg|jpg|jpeg|png|gif|webp)$/,
  new CacheFirst({
    cacheName: "static-assets",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100, // עד 100 קבצים סטטיים
        maxAgeSeconds: 7 * 24 * 60 * 60, // שבוע אחד
      }),
    ],
  }),
  "GET"
);

// 6. גיבוי לדפים נוספים (Stale While Revalidate)
registerRoute(
  ({ url }) => url.pathname.startsWith("/cases") || url.pathname.startsWith("/tasks"),
  new StaleWhileRevalidate({
    cacheName: "dynamic-pages",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 7 * 24 * 60 * 60, // שבוע
      }),
    ],
  }),
  "GET"
);

// 7. Caching של תמונות (Cache First עם תוקף מוגבל)
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  new CacheFirst({
    cacheName: "image-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50, // עד 50 תמונות
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 ימים
      }),
    ],
  }),
  "GET"
);

// 8. ניהול בקשות חוצות-מקור (Cross-Origin)
registerRoute(
  ({ url }) => url.origin !== self.location.origin,
  new NetworkFirst({
    cacheName: "cross-origin-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60, // שעה
      }),
    ],
  }),
  "GET"
);

