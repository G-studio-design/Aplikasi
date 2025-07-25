
self.addEventListener('push', event => {
  let data;
  try {
    // Attempt to parse the data as JSON
    data = event.data.json();
  } catch (e) {
    // If it fails, treat it as plain text
    console.warn('Push event data is not valid JSON. Treating as text.', event.data.text());
    data = { body: event.data.text() };
  }

  const title = data.title || 'Pembaruan Msarch App';
  const options = {
    body: data.body,
    icon: '/msarch-logo.png', // Main icon for the notification body
    badge: '/msarch-logo-badge.png', // Smaller icon for the status bar
    data: {
      url: data.url || '/' // Default URL if none is provided
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // Check if there's already a window open with the same URL
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

self.addEventListener('install', event => {
  console.log('Service Worker: Install');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activate');
  event.waitUntil(self.clients.claim());
});
