// public/sw.js

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');

  if (!event.data) {
    console.error('[Service Worker] Push event but no data');
    return;
  }
  
  try {
    const data = event.data.json();
    
    console.log('[Service Worker] Push data:', data);

    const title = data.title || 'Msarch App Notification';
    const options = {
      body: data.body || 'You have a new update.',
      icon: '/msarch-logo-192.png',
      badge: '/msarch-logo-72.png',
      data: {
        url: data.url || '/dashboard'
      }
    };

    const notificationPromise = self.registration.showNotification(title, options);
    event.waitUntil(notificationPromise);

  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
    // Fallback for plain text notifications if JSON parsing fails
    const title = 'Msarch App Notification';
    const options = {
      body: event.data.text(),
      icon: '/msarch-logo-192.png',
      badge: '/msarch-logo-72.png',
      data: {
        url: '/dashboard'
      }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');
  
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if a window is already open.
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(clients.claim());
});
