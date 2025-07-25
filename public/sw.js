
// /public/sw.js

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[Service Worker] Push event but no data', e);
    data = { title: 'Notifikasi Baru', message: 'Anda memiliki pembaruan baru.' };
  }

  const title = data.title || 'Pembaruan Proyek Msarch';
  const options = {
    body: data.message,
    icon: '/msarch-logo.png', // Main app icon
    badge: '/msarch-logo.png', // Icon for notification tray on mobile
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/' // URL to open on click
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if a window is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('message', (event) => {
  // This listener is no longer the primary way to get notifications,
  // but we can keep it for other potential commands.
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
