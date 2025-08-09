
// /public/sw.js

// Listener untuk instalasi Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  // Skip waiting untuk mempercepat aktivasi
  self.skipWaiting();
});

// Listener untuk aktivasi Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  // Service Worker mengambil kontrol segera
  event.waitUntil(self.clients.claim());
});

// Listener untuk menerima pesan push dari server
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  let data = {};
  // Coba parse data dari payload push, jika ada
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('[Service Worker] Push event data parse error:', e);
      data = {
        title: 'Notifikasi Baru',
        body: event.data.text(),
        url: '/',
      };
    }
  }

  const title = data.title || 'Notifikasi Baru';
  const options = {
    body: data.body || 'Anda memiliki pembaruan baru.',
    icon: '/msarch-logo.png', // Ikon default
    badge: '/msarch-logo.png', // Ikon untuk status bar Android
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listener untuk menangani klik pada notifikasi
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  const promiseChain = self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  }).then((windowClients) => {
    let matchingClient = null;

    // Coba temukan tab yang sudah terbuka dengan URL yang sama
    for (const client of windowClients) {
      if (client.url === urlToOpen) {
        matchingClient = client;
        break;
      }
    }

    // Jika tidak ada yang cocok persis, gunakan tab pertama yang terbuka
    if (!matchingClient && windowClients.length > 0) {
      matchingClient = windowClients[0];
    }

    // Jika tab ditemukan, fokus dan kirim pesan
    if (matchingClient) {
      matchingClient.focus();
      // Kirim pesan ke klien untuk navigasi internal
      matchingClient.postMessage({ type: 'navigate', url: urlToOpen });
      return matchingClient;
    } else {
      // Jika tidak ada tab yang terbuka, buka jendela baru
      return self.clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
