// public/sw.js

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting()); // Activate new service worker as soon as it's installed
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim()); // Become available to all pages
});


self.addEventListener('push', (event) => {
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.warn('Push event without JSON data, falling back to text.');
    data = { body: event.data.text() };
  }

  const title = data.title || 'Msarch App Notification';
  const options = {
    body: data.body || 'You have a new update.',
    icon: '/msarch-logo.png',
    badge: '/msarch-logo-badge.png',
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data.url || '/';

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's already a window open with the same URL.
        for (const client of clientList) {
          // Use URL objects to compare paths without getting confused by query params or hash.
          const clientUrl = new URL(client.url);
          const targetUrlObj = new URL(targetUrl, self.location.origin);

          if (clientUrl.pathname === targetUrlObj.pathname && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is found, open a new one.
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
