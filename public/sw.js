// public/sw.js

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  // Keep it simple and robust. The entire payload is the message string.
  const message = event.data ? event.data.text() : 'Tidak ada pesan.';

  const options = {
    body: message,
    icon: '/msarch-logo.png', // Main icon
    badge: '/msarch-logo-badge.png', // Badge for mobile status bar
  };

  event.waitUntil(
    self.registration.showNotification('Pembaruan Proyek Msarch', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // For now, simply focus or open the main dashboard.
  // More complex URL routing can be added later if needed.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const dashboardUrl = self.registration.scope;

      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === dashboardUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(dashboardUrl);
      }
    })
  );
});