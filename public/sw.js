// public/sw.js

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  let data;
  try {
    // Push data can be text or a buffer, we need to handle both.
    if (event.data) {
      data = JSON.parse(event.data.text());
    } else {
        console.warn('[Service Worker] Push event but no data');
        return;
    }
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
    data = {
      title: 'Msarch App',
      body: 'You have a new update.',
      data: { url: '/' },
    };
  }

  const title = data.title || 'Msarch App';
  const options = {
    body: data.body || 'New notification.',
    icon: '/msarch-logo.png', 
    badge: '/msarch-logo.png',
    data: {
      url: data.data?.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Check if there's already a tab open with the same URL.
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no tab is found, open a new one.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Basic service worker lifecycle.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(clients.claim());
});
