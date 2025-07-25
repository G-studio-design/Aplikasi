// public/sw.js

// Listener untuk instalasi service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Menginstall...');
  // Perintahkan service worker yang baru untuk segera aktif
  event.waitUntil(self.skipWaiting());
});

// Listener untuk aktivasi service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Mengaktifkan...');
  // Ambil alih kontrol dari service worker lama
  event.waitUntil(self.clients.claim());
});

// Listener utama untuk menangani push notification yang masuk
self.addEventListener('push', (event) => {
  console.log('Service Worker: Menerima Push Event.');

  let data;
  try {
    // Kunci utama: Mengurai data yang masuk sebagai JSON
    data = event.data.json();
    console.log('Service Worker: Data push berhasil di-parse:', data);
  } catch (e) {
    console.error('Service Worker: Gagal mengurai data push, menggunakan teks mentah.', e);
    // Fallback jika data bukan JSON
    data = {
      title: 'Pemberitahuan Baru',
      body: event.data.text(),
      url: '/dashboard',
    };
  }
  
  const title = data.title || 'Pemberitahuan Msarch App';
  const options = {
    body: data.body || 'Anda memiliki pembaruan baru.',
    icon: '/msarch-logo.png', // Ikon utama notifikasi
    badge: '/msarch-logo-badge.png', // Ikon kecil untuk status bar Android
    data: {
      url: data.url || '/dashboard' // Simpan URL untuk digunakan saat di-klik
    }
  };

  // Tampilkan notifikasi
  event.waitUntil(self.registration.showNotification(title, options));
});


// Listener untuk saat notifikasi di-klik
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notifikasi di-klik.');

  // Tutup notifikasi yang di-klik
  event.notification.close();

  const notificationData = event.notification.data;
  const urlToOpen = new URL(notificationData.url || '/', self.location.origin).href;

  // Cek apakah ada tab yang sudah membuka URL tujuan
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Jika ada tab yang cocok, fokus ke tab itu
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          console.log('Service Worker: Menemukan tab yang cocok, fokus ke sana.');
          return client.focus();
        }
      }
      // Jika tidak ada tab yang cocok, buka tab baru
      if (self.clients.openWindow) {
        console.log('Service Worker: Tidak ada tab yang cocok, membuka tab baru.');
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});