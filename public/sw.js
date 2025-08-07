// public/sw.js

self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/msarch-logo-192.png',
    badge: '/msarch-logo-72.png',
    data: {
      url: data.url, // Menyimpan URL untuk navigasi
    },
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  const notificationData = event.notification.data;
  event.notification.close();

  const urlToOpen = new URL(notificationData.url || '/', self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  }).then(windowClients => {
    let clientIsFound = false;
    for (const client of windowClients) {
      // Memeriksa apakah ada tab aplikasi yang sudah terbuka
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        clientIsFound = true;
        client.focus();
        // Mengirim pesan ke klien untuk melakukan navigasi
        client.postMessage({ type: 'navigate', url: urlToOpen });
        break;
      }
    }

    if (!clientIsFound) {
      clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
