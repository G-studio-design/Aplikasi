
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Immediately activate the new service worker
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Take control of all open clients (tabs, windows)
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received.');

  let data = {};
  try {
    // The payload from the server should be a JSON string
    data = event.data.json();
  } catch (e) {
    console.error('Service Worker: Failed to parse push data as JSON.', e);
    // Fallback if data is just a string
    data = {
      title: 'Pembaruan Proyek Msarch',
      body: event.data.text(),
      url: '/dashboard'
    };
  }

  const title = data.title || 'Pemberitahuan Msarch';
  const options = {
    body: data.body || 'Anda memiliki pembaruan baru.',
    icon: '/msarch-logo.png', // Main icon
    badge: '/msarch-logo-badge.png', // Icon for status bar on Android
    data: {
      url: data.url || '/dashboard' // URL to open on click
    }
  };

  // Keep the service worker alive until the notification is shown
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification Click Received.');

  event.notification.close(); // Close the notification

  const urlToOpen = event.notification.data.url || '/';

  // Tell the browser to open the URL in a new tab/window
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});
