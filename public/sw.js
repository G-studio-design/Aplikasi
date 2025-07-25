// public/sw.js

// Listener untuk instalasi Service Worker.
// skipWaiting() memaksa service worker yang sedang menunggu untuk menjadi yang aktif.
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  self.skipWaiting();
});

// Listener untuk aktivasi Service Worker.
// clients.claim() memungkinkan service worker yang aktif untuk mulai mengontrol
// semua klien (tab) yang terbuka segera.
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(self.clients.claim());
});

// Listener utama untuk menangani notifikasi push yang masuk dari server.
self.addEventListener('push', (event) => {
  console.log('[SW] Push Received.');

  // Ekstrak data payload dari event.
  // Jika tidak ada data, log dan keluar.
  if (!event.data) {
    console.error('[SW] Push event but no data');
    return;
  }

  // event.waitUntil() sangat penting.
  // Ini memberitahu browser untuk tidak menghentikan service worker
  // sampai promise di dalamnya (menampilkan notifikasi) selesai.
  // Ini adalah kunci untuk keandalan di perangkat mobile.
  event.waitUntil(
    // Parsing data yang dikirim dari server sebagai JSON.
    event.data.json().then(data => {
      console.log('[SW] Push data parsed:', data);

      // Siapkan opsi untuk notifikasi.
      const options = {
        body: data.body, // Isi utama notifikasi.
        icon: '/msarch-logo.png', // Ikon utama yang lebih besar.
        badge: '/msarch-logo-badge.png', // Ikon kecil untuk status bar Android.
        data: {
          url: data.url || '/', // Simpan URL untuk saat notifikasi diklik.
        },
      };

      // Tampilkan notifikasi ke pengguna.
      // Judul diambil dari data, dan opsi yang sudah disiapkan digunakan.
      return self.registration.showNotification(data.title, options);
    }).catch(err => {
      console.error('[SW] Error processing push event', err);
    })
  );
});

// Listener untuk menangani saat pengguna mengklik notifikasi.
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click Received.');

  // Tutup notifikasi yang diklik.
  event.notification.close();

  // Ambil URL yang disimpan di dalam data notifikasi.
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  // event.waitUntil() lagi-lagi penting untuk memastikan browser
  // tidak menghentikan service worker sebelum tab baru/fokus selesai.
  event.waitUntil(
    // self.clients.matchAll() mencari semua tab/jendela yang terbuka
    // yang dikontrol oleh service worker ini.
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Periksa apakah ada tab yang sudah membuka URL tujuan.
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          // Jika ada, fokus ke tab tersebut daripada membuka yang baru.
          return client.focus();
        }
      }
      // Jika tidak ada tab yang cocok, buka jendela baru ke URL tujuan.
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
