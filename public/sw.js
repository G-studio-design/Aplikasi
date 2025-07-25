// public/sw.js

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  let pushData;
  try {
    pushData = event.data.json();
  } catch (e) {
    console.error("Failed to parse push data as JSON", e);
    pushData = {
      title: 'Msarch App',
      message: event.data.text(),
    };
  }

  const title = pushData.title || 'Msarch App Notification';
  const options = {
    body: pushData.message || 'You have a new update.',
    icon: '/msarch-logo.png', // Main app icon
    badge: '/msarch-logo-badge.png', // A smaller icon for the notification bar
    vibrate: [200, 100, 200],
    data: {
      url: pushData.url || '/', // URL to open on click
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // If a window for the app is already open, focus it
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
