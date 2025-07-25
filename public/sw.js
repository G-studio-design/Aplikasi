'use client';

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing.');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating.');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push Received.');

  let notificationData = {
    title: 'Pemberitahuan Msarch',
    body: 'Anda memiliki pembaruan baru.',
    icon: '/msarch-logo.png',
    badge: '/msarch-logo-badge.png',
    data: {
      url: '/dashboard',
    },
  };

  if (event.data) {
    try {
      // event.data.json() akan mem-parse string JSON menjadi objek JavaScript
      const incomingData = event.data.json();
      notificationData.title = incomingData.title || notificationData.title;
      notificationData.body = incomingData.body || notificationData.body;
      notificationData.data.url = incomingData.url || notificationData.data.url;
    } catch (e) {
      console.error('[SW] Error parsing push data, using fallback text.', e);
      // Jika data bukan JSON, tampilkan sebagai teks biasa
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200],
    data: {
      url: notificationData.data.url,
    },
  };

  event.waitUntil(self.registration.showNotification(notificationData.title, options));
});


self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click Received.');
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
