// public/sw.js

self.addEventListener('push', (event) => {
  let data;
  try {
    // Coba parse data sebagai JSON
    data = event.data.json();
  } catch (e) {
    // Jika gagal, anggap sebagai teks biasa
    data = { title: 'Notifikasi Baru', body: event.data.text() };
  }

  const title = data.title || 'Msarch App';
  const options = {
    body: data.body || 'Anda memiliki pembaruan baru.',
    icon: '/msarch-logo.png', // Ikon notifikasi
    badge: '/msarch-logo.png', // Ikon kecil di status bar (Android)
    vibrate: [200, 100, 200],
    data: {
      url: data.data?.url || '/', // URL untuk dibuka saat diklik
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const urlToOpen = new URL(notification.data.url, self.location.origin).href;

  notification.close();

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Jika ada jendela/tab aplikasi yang sudah terbuka, fokuskan itu
      if (clientList.length > 0) {
        let client = clientList[0];
        // Coba cari tab yang sudah terlihat/aktif
        for (const c of clientList) {
          if (c.focused) {
            client = c;
            break;
          }
        }
        // Fokuskan tab dan arahkan ke URL yang benar
        return client.focus().then(c => c.navigate(urlToOpen));
      }
      // Jika tidak ada tab yang terbuka, buka tab baru
      return clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  event.waitUntil(clients.claim());
});
