const CACHE_NAME = 'task-manager-v1';

// Add all static assets we want to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-144x144.png',
  '/icons/icon-192x192.png',
  '/_next/static/css/app.css',
  '/_next/static/js/main.js',
];

// Install event handler
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Fetch event handler for caching strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();

            // Cache the new resource
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Only cache GET requests for static assets
                if (event.request.method === 'GET' && 
                    (event.request.url.includes('/static/') || 
                     event.request.url.includes('/icons/'))) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        ).catch(() => {
          // If both cache and network fail, show a basic offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

// Activate event handler for cache cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification event handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      ...data.options,  // Allow additional options from server
      body: data.body || `תזכורת: ${data.taskName}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-144x144.png',
      vibrate: [200, 100, 200],
      data: {
        taskId: data.taskId,
        url: data.url || '/',
        type: data.type || 'task',
        timestamp: Date.now(),
      },
      dir: 'rtl',
      lang: 'he',
      tag: `task-${data.taskId}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
      timestamp: Date.now(),
      actions: [
        {
          action: 'open',
          title: 'פתח משימה',
        },
        {
          action: 'snooze',
          title: 'דחה ב-5 דקות',
        },
        {
          action: 'dismiss',
          title: 'סגור',
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'תזכורת חדשה', options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle notification action buttons
  if (event.action === 'dismiss') {
    return;
  }

  if (event.action === 'snooze') {
    const { taskId, type, url } = event.notification.data;
    // Schedule new notification in 5 minutes
    setTimeout(() => {
      self.registration.showNotification('תזכורת חוזרת', {
        ...event.notification.options,
        body: event.notification.body + '\n(תזכורת חוזרת)',
        tag: `task-${taskId}-snoozed`,
        renotify: true,
      });
    }, 5 * 60 * 1000);
    return;
  }

  // Default action is 'open'
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing window
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window exists, open a new one
        return clients.openWindow(urlToOpen);
      })
  );
});

// Background sync event handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      getPendingNotifications().then((notifications) => {
        return Promise.all(
          notifications.map((notification) => {
            return self.registration.showNotification(notification.title, notification.options);
          })
        );
      })
    );
  }
});

// Periodic sync for checking pending notifications
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkPendingNotifications());
  }
});

// Utility function to get pending notifications
async function getPendingNotifications() {
  try {
    // Try to open IndexedDB
    const db = await openNotificationsDB();
    const store = db.transaction('notifications', 'readonly').objectStore('notifications');
    return await store.getAll();
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return [];
  }
}

// Utility function to check pending notifications
async function checkPendingNotifications() {
  const notifications = await getPendingNotifications();
  const now = Date.now();

  for (const notification of notifications) {
    if (notification.timestamp <= now && !notification.shown) {
      await self.registration.showNotification(notification.title, notification.options);
      await markNotificationAsShown(notification.id);
    }
  }
}

// IndexedDB setup for notifications
function openNotificationsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NotificationsDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id' });
      }
    };
  });
}

// Mark notification as shown in IndexedDB
async function markNotificationAsShown(id) {
  const db = await openNotificationsDB();
  const transaction = db.transaction('notifications', 'readwrite');
  const store = transaction.objectStore('notifications');
  await store.put({ id, shown: true });
}
