
// public/sw.js

// Listener untuk instalasi service worker
// Ini memastikan service worker baru segera aktif.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(self.clients.claim());
});

// Listener utama untuk notifikasi push yang datang
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');

  // Jika tidak ada data, tampilkan notifikasi default.
  if (!event.data) {
    console.warn('[Service Worker] Push event but no data');
    const defaultNotification = self.registration.showNotification('Pemberitahuan', {
        body: 'Anda memiliki pembaruan baru.',
        icon: '/msarch-logo.png',
        badge: '/msarch-logo-badge.png',
    });
    event.waitUntil(defaultNotification);
    return;
  }
  
  // Ambil data payload dari notifikasi.
  // event.data.json() akan mengurai string JSON yang dikirim dari server.
  const data = event.data.json();
  
  console.log('[Service Worker] Push data:', data);

  const title = data.title || 'Pemberitahuan Baru';
  const options = {
    body: data.body || 'Anda memiliki pesan baru.',
    icon: '/msarch-logo.png',
    badge: '/msarch-logo-badge.png',
    data: {
      url: data.url || '/', // Menyimpan URL untuk digunakan saat notifikasi diklik
    },
  };

  // event.waitUntil() memberitahu browser untuk tidak mematikan
  // service worker sampai notifikasi selesai ditampilkan. Ini sangat penting.
  event.waitUntil(self.registration.showNotification(title, options));
});

// Listener untuk saat pengguna mengklik notifikasi
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');
  
  event.notification.close(); // Tutup notifikasi

  const urlToOpen = event.notification.data.url || '/';

  // event.waitUntil() memastikan browser menunggu sampai tab baru terbuka
  // sebelum mematikan service worker.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Jika tab dengan URL yang sama sudah terbuka, fokus ke tab itu.
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Jika tidak ada tab yang cocok, buka tab baru.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
